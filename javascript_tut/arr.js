const arr=['hello','bye'];
const cop=[...arr];
cop.push(1,2,3);
console.log(cop);
const toarr=(...arg)=>{
    return arg;
}
const per={
    name:'Max',
    age:29,
    hobby:'Back'
}
const {name,Age}=per;
console.log(name,Age);