class Watcher{
  constructor(vm,expr,cb){
    this.vm = vm
    this.expr = expr
    this.cb = cb 
    this.oldValue = this.getOLdValue()
  }
  getOLdValue(){
    Dep.target = this
    const oldValue = compileUtil.getvalue(this.expr,this.vm)
    Dep.target = null;
    return oldValue
  }
  update(){
    const newValue = compileUtil.getvalue(this.expr,this.vm)//判断新旧值是否有变化
    if(newValue !== this.oldValue){
      this.cb(newValue)
    }
  }    
}
class Dep{
  constructor(){
    this.subs = []
  }
  //收集watcher
  addsub(watcher){
    this.subs.push(watcher)
  }
  // 通知观察者去更新
  notify(){
    this.subs.forEach(w=>{
      w.update()
    })
  }
}
class Observer{
  constructor(data){
    this.observe(data) 
  }
  observe(data){
    if(data && typeof data === 'object'){
      Object.keys(data).forEach(key=>{
        this.defineReactive(data,key,data[key])
      })
    }
  }
  defineReactive(data,key,value){
    this.observe(value)
    const dep = new Dep()
    Object.defineProperty(data,key,{  // 劫持并且监听
      enumerable:true,
      // writable:true,
      // configurable:true,
      get(){
        // 数据变化时,往dep里面添加观察者 diff算法
       Dep.target &&  dep.addsub(Dep.target)   
        return value
      },
      set:(newValue)=>{
        this.observe(newValue)
        if(newValue !== value) {
          value = newValue
        }
        dep.notify()
      }
    })
  }
}