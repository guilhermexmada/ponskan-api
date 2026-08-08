const obj = ['A','B','C']
let sum = ''
let m = obj.map((o) => {
    sum += o
    console.log(sum)
} )

console.log(m)