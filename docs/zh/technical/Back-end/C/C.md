# 简单的C#与C++对比
由于我学的很浅就展示一些简单基础的代码

### 输出
C++ 
```c++
 cout << "hello world" << a << b <<endl;  
```  
C#  
```c#
 Console.WriteLine("hello world{0} {1}",a,b);     //{0}=a ，{1}=b 
```

### 输入
C++  
```c++
  int a;  
  cin >> a;  
```
  
C#
```c#
    using System;

    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("请输入您的姓名：");
            string name = Console.ReadLine();
            Console.WriteLine("您好，" + name + "！");

            Console.WriteLine("请输入您的年龄：");
            int age = Convert.ToInt32(Console.ReadLine());
            Console.WriteLine("您的年龄是：" + age);

            Console.ReadLine();
        }
     }
```
### 数组
C++
#### 一维
```c++
    double balance[10];  
    balane[0]=4500.0;  
```
#### 二维
   ```c++
    int a[3][4]={
     {0, 1, 2, 3} ,   /*  初始化索引号为 0 的行 */
     {4, 5, 6, 7} ,   /*  初始化索引号为 1 的行 */
     {8, 9, 10, 11}   /*  初始化索引号为 2 的行 */
    };
   ```

C#
#### 一维
  ```c#
    double[] balance = new double[10];
    balance[0] = 4500.0;
  ```
#### 二维
   ```c#
    int [,] a = new int [3,4] {
      {0, 1, 2, 3} ,   /*  初始化索引号为 0 的行 */
      {4, 5, 6, 7} ,   /*  初始化索引号为 1 的行 */
      {8, 9, 10, 11}   /*  初始化索引号为 2 的行 */
    };
   ```
### 字符串
C++  
   ```c++
    char site[7] = {'R', 'U', 'N', 'O', 'O', 'B', '\0'};  
    char site[] = "RUNOOB";  
   ```

C#  
```c#
    //字符串，字符串连接  
    string fname, lname;  
    fname = "Rowan";  
    lname = "Atkinson";  
    string fullname = fname + lname;  

    //通过使用 string 构造函数  
    char[] letters = { 'H', 'e', 'l','l','o' };  
    string greetings = new string(letters);  
 ```

### 循环
c++与c#语法一致

### 结构体
C++  

  ```c++
     #include <iostream>
    #include <cstring>
 
    using namespace std;
    void printBook( struct Books book );
 
    //  声明一个结构体类型 Books 
    struct Books
    {
       char  title[50];
       char  author[50];
       char  subject[100];
       int   book_id;
    };
 
    int main( )
    {
       Books Book1;        // 定义结构体类型 Books 的变量 Book1
       Books Book2;        // 定义结构体类型 Books 的变量 Book2
 
        // Book1 详述
       strcpy( Book1.title, "C++ 教程");
       strcpy( Book1.author, "Runoob"); 
       strcpy( Book1.subject, "编程语言");
       Book1.book_id = 12345;
 
       // Book2 详述
       strcpy( Book2.title, "CSS 教程");
       strcpy( Book2.author, "Runoob");
       strcpy( Book2.subject, "前端技术");
       Book2.book_id = 12346;
     
       // 输出 Book1 信息
       printBook( Book1 );
     
       // 输出 Book2 信息
       printBook( Book2 );
     
       return 0;
    }

    //c++函数在结构体外声明
    void printBook( struct Books book )
    {
       cout << "书标题 : " << book.title <<endl;
       cout << "书作者 : " << book.author <<endl;
       cout << "书类目 : " << book.subject <<endl;
       cout << "书 ID : " << book.book_id <<endl;
    }
  ```

C#  

   ```c#
    using System;
    using System.Text;
    struct Books
    {
       private string title;
       private string author;
       private string subject;
       private int book_id;

       //c#的函数是可以在结构体内声明的
       public void setValues(string t, string a, string s, int id)
       {
          title = t;
          author = a;
          subject = s;
          book_id =id; 
       }
       public void display()
       { 
          Console.WriteLine("Title : {0}", title);
          Console.WriteLine("Author : {0}", author);
          Console.WriteLine("Subject : {0}", subject);
          Console.WriteLine("Book_id :{0}", book_id);
        }

    }; 

    public class testStructure
    {
       public static void Main(string[] args)
       {
          Books Book1 = new Books(); /* 声明 Book1，类型为 Books */
          Books Book2 = new Books(); /* 声明 Book2，类型为 Books */
    
         /* book 1 详述 */
          Book1.setValues("C Programming",
          "Nuha Ali", "C Programming Tutorial",6495407);
    
          /* book 2 详述 */
          Book2.setValues("Telecom Billing",
          "Zara Ali", "Telecom Billing Tutorial", 6495700);
    
          /* 打印 Book1 信息 */
          Book1.display();
    
          /* 打印 Book2 信息 */
          Book2.display(); 
    
          Console.ReadKey();
       }
    }
   ```

### 类与对象
C++  

```c++
    #include <iostream>

    class Rectangle
    //基本形式
    /*
    public:
    ... ...;
    ... ...;
    private:
    ... ...;
    ... ...;
    */
     {
    private:
        double length;
        double width;

    public: 
        void Acceptdetails() {
            std::cout << "请输入长度：";
            std::cin >> length;
            std::cout << "请输入宽度：";
            std::cin >> width;
        }
    
        double GetArea() {
            return length * width;
        }
    
        void Display() {
            std::cout << "长度： " << length << std::endl;
            std::cout << "宽度： " << width << std::endl;
            std::cout << "面积： " << GetArea() << std::endl;
        }
    };
    
    int main() {
        Rectangle r;
        r.Acceptdetails();
        r.Display();
        return 0;
    }
```
    
C#  

```c#
    using System;
    
    namespace RectangleApplication
    {
        class Rectangle
    //基本形式：
        //private ... ... ...;
        //public ... ... ...;
        {
            //成员变量
            private double length;
            private double width;
    
            public void Acceptdetails()
            {
                Console.WriteLine("请输入长度：");
                length = Convert.ToDouble(Console.ReadLine());
                Console.WriteLine("请输入宽度：");
                width = Convert.ToDouble(Console.ReadLine());
            }
             public double GetArea()
            {
                return length * width;
            }
            public void Display()
            {
                Console.WriteLine("长度： {0}", length);
                Console.WriteLine("宽度： {0}", width);
                Console.WriteLine("面积： {0}", GetArea());
            }
        }//end class Rectangle

        class ExecuteRectangle
        {
            static void Main(string[] args)
             {
                Rectangle r = new Rectangle();
                r.Acceptdetails();
                r.Display();
                Console.ReadLine();
             }
        }
    }
```