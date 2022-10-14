// Utility fun
import { Mat } from "./mat";

export function assert(condition: boolean, message = "Assertion failed") {
  // from http://stackoverflow.com/questions/15313418/javascript-assert
  if (!condition) {
    if (typeof Error !== "undefined") {
      throw new Error(message);
    }
    throw message; // Fallback
  }
}

// Random numbers utils
let return_v = false;
let v_val = 0.0;
export const gaussRandom = function(): number {
  if(return_v) {
    return_v = false;
    return v_val;
  }
  const u = 2*Math.random()-1;
  const v = 2*Math.random()-1;
  const r = u*u + v*v;
  if (r == 0 || r > 1) return gaussRandom();
  const c = Math.sqrt(-2*Math.log(r)/r);
  v_val = v*c; // cache this
  return_v = true;
  return u*c;
}
export const randf = function(a: number, b: number): number { return Math.random()*(b-a)+a; }
export const randi = function(a: number, b: number): number { return Math.floor(Math.random()*(b-a)+a); }
export const randn = function(mu: number, std: number): number { return mu+gaussRandom()*std; }

// export const copyNet = function(net) {
//   // nets are (k,v) pairs with k = string key, v = Mat()
//   var new_net = {};
//   for(var p in net) {
//     if(net.hasOwnProperty(p)){
//       new_net[p] = copyMat(net[p]);
//     }
//   }
//   return new_net;
// }

// export const updateMat = function(m: Mat, alpha: number): void {
//   // updates in place
//   for(let i=0,n=m.n*m.d;i<n;i++) {
//     if(m.dw[i] !== 0) {
//       m.w[i] += - alpha * m.dw[i];
//       m.dw[i] = 0;
//     }
//   }
// }

// export const updateNet = function(net, alpha) {
//   for(var p in net) {
//     if(net.hasOwnProperty(p)){
//       updateMat(net[p], alpha);
//     }
//   }
// }

// export const netToJSON = function(net) {
//   var j = {};
//   for(var p in net) {
//     if(net.hasOwnProperty(p)){
//       j[p] = net[p].toJSON();
//     }
//   }
//   return j;
// }
// export const netFromJSON = function(j) {
//   var net = {};
//   for(var p in j) {
//     if(j.hasOwnProperty(p)){
//       net[p] = new Mat(1,1); // not proud of this
//       net[p].fromJSON(j[p]);
//     }
//   }
//   return net;
// }
// export const netZeroGrads = function(net) {
//   for(var p in net) {
//     if(net.hasOwnProperty(p)){
//       var mat = net[p];
//       gradFillConst(mat, 0);
//     }
//   }
// }
// export const netFlattenGrads = function(net) {
//   var n = 0;
//   for(var p in net) { if(net.hasOwnProperty(p)){ var mat = net[p]; n += mat.dw.length; } }
//   var g = new Mat(n, 1);
//   var ix = 0;
//   for(var p in net) {
//     if(net.hasOwnProperty(p)){
//       var mat = net[p];
//       for(var i=0,m=mat.dw.length;i<m;i++) {
//         g.w[ix] = mat.dw[i];
//         ix++;
//       }
//     }
//   }
//   return g;
// }

// Mat utils
// fill matrix with random gaussian numbers
export const fillRandn = function(m: Mat, mu: number, std: number): void {
  for(let i = 0, n = m.w.length; i < n; i++) {
    m.w[i] = randn(mu, std);
  }
}
export const fillRand = function(m: Mat, lo: number, hi: number) {
  for(let i = 0, n = m.w.length; i < n; i++) {
    m.w[i] = randf(lo, hi);
  }
}
// export const gradFillConst = function(m: Mat, c: number) {
//   for(let i = 0, n = m.dw.length; i < n; i++) {
//     m.dw[i] = c;
//   }
// }

export const sig = function(x: number): number {
  // helper function for computing sigmoid
  return 1.0 / (1 + Math.exp(-x));
}

export const maxi = function(w: number[] | Float64Array): number {
  // argmax of array w
  let maxv = w[0];
  let maxix = 0;
  for(let i = 1, n = w.length; i < n; i++) {
    const v = w[i];
    if(v > maxv) {
      maxix = i;
      maxv = v;
    }
  }
  return maxix;
}

export const samplei = function(w: number[]): number {
  // sample argmax from w, assuming w are
  // probabilities that sum to one
  const r = randf(0,1);
  let x = 0.0;
  let i = 0;
  while(true) {
    x += w[i];
    if(x > r) { return i; }
    i++;
  }
  return w.length - 1; // pretty sure we should never get here?
}

export const setConst = function<T>(arr: number[] | Float64Array, c: number): void {
  for(let i = 0, n = arr.length; i < n; i++) {
    arr[i] = c;
  }
}

export const sampleWeighted = function(p: number[]): number {
  const r = Math.random();
  let c = 0.0;
  for(let i = 0, n = p.length; i < n; i++) {
    c += p[i];
    if(c >= r) {
      return i;
    }
  }
  assert(false, 'wtf');
  return 0;
}
