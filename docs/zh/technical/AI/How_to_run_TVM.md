# TVM快速使用指南

## 1. 相关样例
**笔者在本文中以sigmoid算子为例，不过优化效果并不明显，后续有待寻找问题所在**
```
import tvm
from tvm import te
from tvm import meta_schedule as ms
from tvm.meta_schedule.database import JSONDatabase
import multiprocessing
import numpy as np
import traceback
import os

# ================================================================
# 1. 定义计算
# ================================================================
def sigmoid(M, N, dtype="float32"):
    """定义 Sigmoid 计算"""
    A = te.placeholder((M, N), name="A", dtype=dtype)
    C = te.compute(
        (M, N),
        lambda i, j: 1 / (1 + tvm.tir.exp(-A[i, j])),
        name="C"
    )
    return te.create_prim_func([A, C])


# ================================================================
# 2. 调优并构建模块
# ================================================================
def tune_and_build_sigmoid(M, N, dtype="float32", target=None, work_dir="./tune_sigmoid"):
    if target is None:
        num_cores = multiprocessing.cpu_count()
        target = f"llvm -num-cores={num_cores}"

    func = sigmoid(M, N, dtype)

    try:
        print("🚀 开始自动调优...")
        result = ms.tune_tir(
            mod=func,
            target=target,
            work_dir=work_dir,
            max_trials_global=100,
            num_trials_per_iter=10,
        )

        print("调优返回类型:", type(result))
        print("repr:", repr(result)[:200])

        # ================================================================
        # ✅ 如果返回 JSONDatabase，从数据库中提取最佳 schedule
        # ================================================================
        if isinstance(result, JSONDatabase):
            print("📂 检测到 JSONDatabase，尝试从中加载最佳调度...")

            # 从数据库中获取所有调优记录
            records = list(result.get_all_tuning_records())
            if not records:
                raise RuntimeError("数据库为空，未找到任何调优记录")

            # 取第一个调优记录的 workload（这里只有一个算子）
            workload = records[0].workload

            # 获取该 workload 的最优调优记录
            try:
                best_tuning_record = result.get_top_k(workload, top_k=1)[0]
            except TypeError:
                # 如果接口变动，尝试旧参数名
                best_tuning_record = result.get_top_k(workload, k=1)[0]
            print("✅ 已找到最优调度记录，准备提取调度...")

            # TVM 0.23.dev0 的方式：通过 as_measure_candidate() 取出 schedule
            candidate = best_tuning_record.as_measure_candidate()
            sch = candidate.sch

            print("✅ 获取调度成功，开始构建模块...")
            mod = tvm.build(sch.mod, target=target)
            print("✅ 使用最优调度构建成功！")
            return result, mod, None

        # ================================================================
        # ✅ 如果返回的是 IRModule（旧版本兼容）
        # ================================================================
        elif isinstance(result, tvm.IRModule):
            print("✅ 检测到 IRModule，直接构建中...")
            mod = tvm.build(result, target=target)
            return result, mod, None

        else:
            raise RuntimeError(f"未知的调优返回类型: {type(result)}")

    except Exception as e:
        print("\n⚠️ 自动调优失败，进入回退模式")
        traceback.print_exc()
        print("调优目录:", os.path.abspath(work_dir))
        mod = tvm.build(func, target=target)
        return None, mod, e


# ================================================================
# 3. 测试函数
# ================================================================
def test_sigmoid_module(mod, M, N, target="llvm"):
    print("🧪 测试模块功能与性能...")

    a_np = np.random.uniform(-5, 5, size=(M, N)).astype("float32")
    c_np = np.zeros_like(a_np)

    dev = tvm.device(target.split()[0], 0)
    a_tvm = tvm.runtime.tensor(a_np, device=dev)
    c_tvm = tvm.runtime.tensor(c_np, device=dev)
    
    # 2. 预热运行（排除首次调用 overhead）
    mod(a_tvm, c_tvm)
    dev.sync()  # 确保预热完成
    
    # 3. 多次运行取平均（100次）
    import time
    run_times = 100
    start = time.time()
    for _ in range(run_times):
        mod(a_tvm, c_tvm)
    dev.sync()  # 确保所有计算完成
    end = time.time()
    
    # 4. 计算精准性能
    total_time_us = (end - start) * 1e6
    avg_latency_us = total_time_us / run_times
    flop = 3 * M * N  # Sigmoid 单元素计算量
    gflops = (flop * run_times) / (total_time_us * 1e3)  # 转换为 GFLOPS
    
    # 精度验证
    expected = 1 / (1 + np.exp(-a_np))
    diff = np.max(np.abs(c_tvm.numpy() - expected))
    
    # 打印精准数据
    print(f"📊 精准性能指标：GFLOPS = {gflops:.4f} | 平均延迟 = {avg_latency_us:.4f} μs")
    print(f"🔍 最大误差：{diff:.6e}")
    return diff < 1e-5, gflops, avg_latency_us


# ================================================================
# 4. 主入口
# ================================================================
if __name__ == "__main__":
    M, N = 1024, 1024
    num_cores = multiprocessing.cpu_count()
    target = f"llvm -num-cores={num_cores}"

    print(f"使用目标: {target}")
    print(f"矩阵大小: {M}x{N}")

    # === 调优 + 构建 ===
    result, mod, error = tune_and_build_sigmoid(M, N, target=target)

    if result is not None:
        print("\n🎉 自动调优成功！")
        if hasattr(result, "trace"):
            print("优化调度轨迹:")
            print(result.trace)
    else:
        print("\nℹ️ 使用默认调度")
        if error:
            print(f"错误信息: {error}")

    # === 测试模块 ===
    success = test_sigmoid_module(mod, M, N, target)

    if success:
        print("\n🎊 所有测试通过！Sigmoid 优化完成。")
    else:
        print("\n💡 功能测试失败，请检查计算定义或调度。")

```

**输出结果应为**
```
调优返回类型: <class 'tvm.meta_schedule.database.json_database.JSONDatabase'>
repr: meta_schedule.JSONDatabase(0x600001070ea8)
📂 检测到 JSONDatabase，尝试从中加载最佳调度...
✅ 已找到最优调度记录，准备提取调度...
✅ 获取调度成功，开始构建模块...
✅ 使用最优调度构建成功！

🎉 自动调优成功！
🧪 测试模块功能与性能...
📊 精准性能指标：GFLOPS = 12.0841 | 平均延迟 = 260.3197 μs
🔍 最大误差：0.000000e+00

🎊 所有测试通过！Sigmoid 优化完成。
```

其中核心API为：
- 计算定义：te.placeholder, te.compute, tvm.tir.exp, te.create_prim_func
- 自动调优（MetaSchedule）：ms.tune_tir, JSONDatabase, as_measure_candidate, tvm.build
- 测试和性能测量：tvm.runtime.tensor, mod(), dev.sync(), numpy 对比验证

## 2.核心API介绍

### 1.计算定义相关 (tvm.te, tvm.tir)
这些 API 用于定义计算图（即算子逻辑），属于 TVM 的 Tensor Expression (TE) 层。

1. [tvm.te.placeholder(shape, dtype=None, name='placeholder')](https://tvm.apache.org/docs/reference/api/python/te.html#tvm.te.placeholder) 

    作用:
    创建一个输入张量（占位符），相当于定义计算的输入变量。

    `A = te.placeholder((M, N), name="A", dtype="float32")`

    参数说明

    | 参数      | 含义                        |
    | ------- | ------------------------- |
    | `shape` | 张量的形状 (tuple 或 list)      |
    | `name`  | 张量名称（便于调试）                |
    | `dtype` | 数据类型，如 "float32", "int32" |

    **返回值**

    - 一个 tvm.te.Tensor 对象，可以在 te.compute 中使用。

    **⚠️注意点**
    - placeholder 仅定义输入，不含具体数值；
    - shape 必须是静态（常数）形状；
    - dtype 必须是 TVM 支持的类型（float32 / float16 / int32 / etc）。

2. [tvm.te.compute(shape, fcompute, name='compute', tag='', attrs=None, varargs_names=None)](https://tvm.apache.org/docs/reference/api/python/te.html#tvm.te.compute)

    **作用**

    定义输出张量的计算逻辑。\
    TVM 会基于这个定义构建计算图。

    ```python
    C = te.compute(
        (M, N),
        lambda i, j: 1 / (1 + tvm.tir.exp(-A[i, j])),
        name="C"
    )
    ```
    **参数说明**
    | 参数         | 含义                       |
    | ---------- | ------------------------ |
    | `shape`    | 输出张量的形状                  |
    | `fcompute` | 一个 lambda 函数，定义每个元素的计算规则 |
    | `name`     | 张量名称                     |

    返回值

    - 一个新的 tvm.te.Tensor，描述计算结果。

    注意点

    - fcompute 的参数数量必须与 shape 维度一致；

    - 不能包含 Python 控制流（如 if），必须是纯符号计算；

    - 计算表达式中应使用 tvm.tir 下的数学函数（如 exp, sqrt, floor 等）。

3. [tvm.tir.exp(x)](https://tvm.apache.org/docs/reference/api/python/te.html#tvm.te.exp)

    **作用**
    计算 e^x，对应于指数函数。属于 TIR 内置算子。

    注意点

    只能用于符号计算中；

    不能直接对 numpy 数组或 Python float 调用；

    如果想要编译后在 runtime 层使用真实数值，需通过 tvm.build 生成执行模块。

4. [te.create_prim_func(tensors: List[tvm.te.Tensor])](https://tvm.apache.org/docs/reference/api/python/te.html#tvm.te.create_prim_func)

    **作用**
    将 TE 层的计算定义（placeholder + compute）转换成一个可调度的 PrimFunc。
    PrimFunc 是 TVM 的中间表示（IR）层形式，供调度器和编译器使用。
    ```
    func = te.create_prim_func([A, C])
    ```

    返回值

    - 一个 tvm.ir.PrimFunc 对象，可以被调度或直接编译。

    注意点

    - 输入列表顺序必须正确（先输入，再输出）；

    - PrimFunc 是不可变的（immutable）；

    - 这是自动调优或 build 之前的必要转换步骤。


### 2.自动调优与编译 (tvm.meta_schedule, tvm.build)
5. [tvm.meta_schedule.tune_tir(...)](https://tvm.apache.org/docs/reference/api/python/meta_schedule.html#tvm.meta_schedule.tune_tir)

    **作用**

    对一个 PrimFunc 进行 自动调优（Auto-Tuning），搜索最优调度策略。
    是 TVM MetaSchedule 的核心 API。

    ```
    result = ms.tune_tir(
        mod=func,
        target="llvm",
        work_dir="./tune_sigmoid",
        max_trials_global=100,
        num_trials_per_iter=10,
    )
    ```

    **参数说明**

    | 参数                    | 含义                                  |
    | --------------------- | ----------------------------------- |
    | `mod`                 | 要调优的函数，可以是 `PrimFunc` 或 `IRModule`  |
    | `target`              | 调优目标（如 "llvm", "cuda", "rocm", etc） |
    | `work_dir`            | 存放调优记录的路径                           |
    | `max_trials_global`   | 全局最大调优次数                            |
    | `num_trials_per_iter` | 每轮迭代的采样次数                           |


    返回值

    - 可能是：

        - tvm.meta_schedule.database.JSONDatabase（保存调优结果）

        - tvm.IRModule（部分旧版兼容返回 IRModule）

    注意点

    - 调优会运行多次候选调度在目标设备上实际执行；

    - 调优时间可能很长；

    - 建议本地 CPU 使用 llvm，GPU 使用 cuda；

    - 数据库默认在 work_dir 下存储 JSON 文件，可复用。

6. [tvm.meta_schedule.Database(*args: Any, **kwargs: Any)](https://tvm.apache.org/docs/reference/api/python/meta_schedule.html#tvm.meta_schedule.Database)

    **作用**

    存储和管理自动调优的记录结果（每个 workload 的 schedule、性能、参数等）。

    **常用方法：**
    | 方法                              | 作用                         |
    | ------------------------------- | -------------------------- |
    | `.get_all_tuning_records()`     | 获取所有调优记录                   |
    | `.get_top_k(workload, top_k=1)` | 获取某个 workload 的性能最佳的 k 条记录 |
    | `.commit_tuning_record(record)` | 手动写入一条调优记录                 |

    注意点：

    - 每条调优记录对应一个 workload；

    - 可以持久化保存调优数据，下次加载使用；

    - 用于生产环境时，建议保存调优结果以免重复训练。

7. [tvm.build(input, target="llvm", name=None)]()

    **作用**

    将 调度好的计算图（IRModule / Schedule） 编译成可执行模块。
    ```
    mod = tvm.build(sch.mod, target="llvm")
    ```

    **参数说明**

    | 参数       | 含义                                  |
    | -------- | ----------------------------------- |
    | `input`  | 可以是 IRModule、PrimFunc 或 Schedule 对象 |
    | `target` | 编译目标（"llvm"、"cuda"、"rocm" 等）        |
    | `name`   | 可选模块名称                              |

    返回值

    - tvm.runtime.Module，可在 Python 中直接调用。

    注意点

    - target 必须与运行设备一致；

    - 不同 target 有不同的后端编译器；

    - 构建完成的模块可以序列化保存，复用。

8. [best_tuning_record.as_measure_candidate()]()

    **作用**

    从调优记录中提取一个可执行候选（包含 schedule 与参数）。

    注意点

    - 返回一个 MeasureCandidate 对象；

    - 通过 candidate.sch 获取调度；

    - 通常在 tune_tir 之后，从数据库提取最优调度时使用。


### 3.执行与测试 (tvm.runtime)
9. [tvm.device(target, dev_id=0)]()

    **作用**

    获取一个设备对象，用于运行编译模块。
    ```
    dev = tvm.device("llvm", 0)
    ```

    **参数说明**

    | 参数       | 含义                                   |
    | -------- | ------------------------------------ |
    | `target` | 设备类型，如 `"llvm"`, `"cuda"`, `"metal"` |
    | `dev_id` | 设备编号（通常为 0）                          |


    返回值

    - 一个 tvm.runtime.Device 对象。

    注意点

    - target 必须与 build 时一致；

    - GPU 上需确保驱动和 CUDA 环境正常。

10. tvm.runtime.tensor(data, device)

     **作用**

    将 NumPy 数组或 Python 数据创建为 TVM 运行时张量。
    ```
    a_tvm = tvm.runtime.tensor(a_np, device=dev)
    ```

    注意点

    - dtype 会根据 numpy 数组自动推断；

    - 分配在指定 device 上；

    - 是 runtime 级别的实际数据载体（可执行）。

11. mod(a_tvm, c_tvm)

    **作用**
    运行编译好的 TVM 模块。

    说明

    - TVM 会自动匹配输入输出参数；

    - 执行时自动调用对应 target 的后端；

    - 完成后，输出张量中存储计算结果。

12. dev.sync()

    **作用**

    等待设备上所有计算完成。常用于性能测试前后保证同步。

    注意点

    - 对 CPU 来说几乎无影响；

    - 对 GPU、异步设备来说很重要，否则计时不准确。
    
---
2004

> **作者：** ChatGpt\
>**提交者：** 王胤吉\
> **更新日期:** 2025/11/3


