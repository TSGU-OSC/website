# Java - ThreadLocal

##  什么是**ThreadLocal**？

**ThreadLocal**可以翻译为*线程本地存储*，是用来解决多线程间对共享资源的访问安全性的一种技术。

当我们在面临多线程并发问题时，例如线程A创建了对于一个共享资源（static）的访问链接，此时当线程A正在访问该资源时，线程B也通过该链接开始对资源进行访问，而当线程A访问资源完毕后关闭了对于资源的访问链接，那么线程B就会出错。

一种解决方案是不将该资源设为共享的（不用static修饰），但是会造成内存资源的浪费，每个线程都会创建一个资源对象，对于内存不友好，并且随着线程的创建与销毁，服务器会频繁的创建与销毁资源对象，对服务器不友好且效率低下。

此时我们就可以使用**ThreadLocal**技术，用于解决多线程对共享资源的访问安全性问题。

## ThreadLocal如何实现线程隔离？

**ThreadLocal**会为每个线程创建一个资源的副本，线程之间互不影响，每个线程只需要访问自己的资源副本即可，服务器效率大大提高。

> 但是正是由于每个线程中都会有一个资源的副本，所以使用ThreadLocal也不一定对内存更友好，需要具体问题具体分析。

**ThreadLocal**会将<ThreadLocal,资源副本>作为key-value形式存储在*ThreadLocalMap*对象中，线程可以通过当前线程来获取本线程的资源对象。

## ThreadLocalMap

**ThreadLocalMap**类似于*Map*，但它不是*Map*，因为ThreadLocalMap并没有实现Map接口。

ThreadLocalMap中有一个**Entry**类：

```java
static class Entry extends WeakReference<ThreadLocal<?>> {
            /** The value associated with this ThreadLocal. */
            Object value;

            Entry(ThreadLocal<?> k, Object v) {
                super(k);
                value = v;
            }
        }
```

将*ThreadLocal*作为Key，资源对象*Object*作为Value存放在*Entry*中，**ThreadLocalMap**维护一个Entry数组来保存各个线程的本地资源。

**ThreadLocalMap**中有一个set方法来设置一个Entry：

大致逻辑是通过ThreadLocal的Hash值来作为数组下标找到对应的Key，将其Value覆盖，如果没有找到对应Key，就新建一个

```java
 private void set(ThreadLocal<?> key, Object value) {

            // We don't use a fast path as with get() because it is at
            // least as common to use set() to create new entries as
            // it is to replace existing ones, in which case, a fast
            // path would fail more often than not.

            Entry[] tab = table;
            int len = tab.length;
            int i = key.threadLocalHashCode & (len-1);

            for (Entry e = tab[i];
                 e != null;
                 e = tab[i = nextIndex(i, len)]) {
                if (e.refersTo(key)) {
                    e.value = value;
                    return;
                }

                if (e.refersTo(null)) {
                    replaceStaleEntry(key, value, i);
                    return;
                }
            }

            tab[i] = new Entry(key, value);
            int sz = ++size;
            if (!cleanSomeSlots(i, sz) && sz >= threshold)
                rehash();
        }

```

**ThreadLocalMap**中有一个remove方法来移除一个Entry：

大致的逻辑是，通过ThreadLocal的Hash值作为数组下标找到对应的Key，删除相应Entry

```java
private void remove(ThreadLocal<?> key) {
            Entry[] tab = table;
            int len = tab.length;
            int i = key.threadLocalHashCode & (len-1);
            for (Entry e = tab[i];
                 e != null;
                 e = tab[i = nextIndex(i, len)]) {
                if (e.refersTo(key)) {
                    e.clear();
                    expungeStaleEntry(i);
                    return;
                }
            }
        }
```

## 如何使用ThreadLocal？

### init

**ThreadLocal**中有一个初始化方法:

```java
protected T initialValue() {
        return null;
    }
```

可以通过重写这个方法在线程创建时执行一些操作，例如数据库连接的创建:

```java
public class ConnectionManager {

    private static final ThreadLocal<Connection> dbConnectionLocal = new ThreadLocal<Connection>() {
        @Override
        protected Connection initialValue() {
            try {
                return DriverManager.getConnection("", "", "");
            } catch (SQLException e) {
                e.printStackTrace();
            }
            return null;
        }
    };

    public Connection getConnection() {
        return dbConnectionLocal.get();
    }
}
```

> 我们可以看到，ThreadLocal的修饰符通常是private static final，它本身是一个共享资源，内部通过ThreadLocalMap维护一个<ThreadLocal，Object>形式的Key-Value数组来实现多线程隔离

### set

**ThreadLocal**有一个set方法：

```java
   public void set(T value) {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null) {
            map.set(this, value);
        } else {
            createMap(t, value);
        }
    }

```

可以通过调用该方法将对象存到ThreadLocalMap中

### get

**ThreadLocal**中有一个get方法：

```java
    public T get() {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null) {
            ThreadLocalMap.Entry e = map.getEntry(this);
            if (e != null) {
                @SuppressWarnings("unchecked")
                T result = (T)e.value;
                return result;
            }
        }
        return setInitialValue();
    }
```

可以通过调用该方法获取ThreadLocal对应的对象，如果没有相应对象，就会调用**setInitialValue()**

```java
    private T setInitialValue() {
        T value = initialValue();
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null) {
            map.set(this, value);
        } else {
            createMap(t, value);
        }
        if (this instanceof TerminatingThreadLocal) {
            TerminatingThreadLocal.register((TerminatingThreadLocal<?>) this);
        }
        return value;
    }
```

**setInitialValue()**方法会通过**initialValue()**方法为ThreadLocal初始化一个Value

### remove

我们现在知道，在ThreadLocalMap中，一个ThreadLocal作为Key对应一个Value，可是如果线程ThreadLocal一直存在的话，内存中就会一直保存这个Entry<ThreadLocal,Value>，但是我们不可能因为不需要Value就销毁一个线程，此时无用却无法删除的Value便造成了**内存泄露**。

为此，**ThreadLocal**提供了一个**remove**方法：

```java
     public void remove() {
         ThreadLocalMap m = getMap(Thread.currentThread());
         if (m != null) {
             m.remove(this);
         }
     }
```

可以看出这个remove方法是调用的ThreadLocalMap.remove()方法，用于删除一个Entry<ThreadLocal,Value>

