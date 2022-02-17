
const compileUtil = {
  getvalue(expr,vm){
    return expr.split('.').reduce((data,currentVal)=>{    
      return data[currentVal]
    },vm.$data)
  },
  setVal(expr,vm,inputVal){
    return expr.split('.').reduce((data,currentVal)=>{    
       data[currentVal] = inputVal
    },vm.$data)
  },
  text(node,expr,vm) {  //expr v-model 后面的绑定参数  vm实例
    let value
    if(expr.indexOf('{{')!== -1){
      value = expr.replace(/\{\{(.+?)}\}/g,(...args)=>{
        console.log(args)
        return this.getvalue(args[1],vm)
      })
    } else {
      value =this.getvalue(expr,vm)
    }
    // const value =this.getvalue(expr,vm)
    this.updater.textUpdater(node,value)
  },
  bind(node,expr,vm,attrName){}, // 处理v-bind
  html(node,expr,vm){
    // let value
    // if(expr.indexOf('{{'!== -1)){
    //   value = expr.replace(/\{\{(.+?)}\}/g,(...args)=>{
    //     console.log(args)
    //   })
    // }
    // 触发更新
    new Watcher((vm,expr,newval)=>{
      this.updater.htmlUpdater(node,newval)
    })
    const value =this.getvalue(expr,vm)
    this.updater.htmlUpdater(node,value)
  },
  on(node,expr,vm,eventName){
    let fn = vm.$options.methods && vm.$options.methods[expr]
    node.addEventListener(eventName,fn.bind(vm),false)
  },
  model(node,expr,vm){
    const value =this.getvalue(expr,vm) 
    // 数据=> 视图
    new Watcher(vm,expr,(newval)=>{
      this.updater.modelUpdater(node,newval)
    })
    // 视图=》数据=》视图
    node.addEventListener('input',(e)=>{
      this.setVal(expr,vm,e.target.value)
      console.log(vm)
    })
    this.updater.modelUpdater(node,value)
  },
  updater:{
    textUpdater(node,value){
      node.textContent = value
    },
    modelUpdater(node,value){
      console.log(node)
      node.value = value
    },
    htmlUpdater(node,value){
      node.innerHTML = value
    }
  }
}
class Compile{
  constructor(el,vm) {  // el  vm实例
    this.el = this.isElementNode(el) ? el: document.querySelector(el) // 判断是不是el节点
    this.vm = vm
    // 获取文档碎片对象 放入内存中会减少页面的回流和重绘
    const fragment = this.node2Fragment(this.el)
    // console.log(fragment) // #app 下面的所有子节点
        // 2 编译模板
    this.compile(fragment)
    //追加子元素 加载到el上
    this.el.appendChild(fragment)
  }
  compile(fragment){
    // 获取子节点
    const childNodes = fragment.childNodes;
    console.log(childNodes);
    [...childNodes].forEach(child=>{
      if(this.isElementNode(child)){
        //判断是不是元素节点  编译元素节点
        this.compileElement(child)
      } else {
        // 文本节点 编译文本节点
        this.compileText(child)
      }
      // 如果子元素还有 子节点 继续编译
      if(child.childNodes && child.childNodes.length){
        this.compile(child)
      }
    })
  }
  compileElement(node){
   const attributes = node.attributes
   //console.log(attributes)  // 对象
   ;[...attributes].forEach(attr => {
     const {name ,value} = attr
    // console.log(name,value)
     if(this.isDirective(name)){  // 是否以v-开头 代表是指令
      const [,directive] = name.split('-') // text html model on:click
      const [dirName,eventName] = directive.split(':')
      // 更新数据 数据驱动视图
      compileUtil[dirName](node,value,this.vm,eventName)
      // 删除有指令标签上的属性
      node.removeAttribute('v-'+ directive)
     } else if(this.isEventName(name,node)){  // 判断是否是函数名 是函数名自动匹配v-on

     }
   });
  }
  isEventName(attrName,node){
    // let [,eventName] =name.split('@');
    // compileUtil['on'](node,value,this.vm,eventName)
  }
  isDirective(attrName){
    return attrName.startsWith('v-')
  }
  compileText(node){
    const  content = node.textContent
    if(/\{\{(.+?)}\}/.test(content)){ // 所有带大括号的
     //console.log(content);
     compileUtil['text'](node,content,this.vm)
    } 
  }
  node2Fragment(el){ // 根元素
    const f = document.createDocumentFragment() // 创建文档碎片
    let firstChild
    while(firstChild = el.firstChild){
      f.appendChild(firstChild)
    }
    return f
  }
  isElementNode(node) { 
    return node.nodeType === 1  // 判断是不是node节点
  }
}
class vueNew{
  constructor(options){
    this.$el = options.el
    this.$data = options.data
    this.$options = options
    if(this.$el) {
      // 1 数据的观察者
      new Observer(this.$data)
      // 2 指令的解析器
      new Compile(this.$el,this)  // 
    }
  }
  proxy(data){
    for(const key in  data) {
      Object.defineProperty(this,key,{
        get(){
          return data[key]
        },
        set(newval){
          data[key] = newval
        }
      })
    }
  }
}