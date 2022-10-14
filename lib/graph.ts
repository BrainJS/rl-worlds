// Transformer definitions
import { assert, sig } from "./utilities";
import { Mat } from "./mat";

export class Graph {
  needs_backprop: boolean;
  backprop: Array<() => void>;
  constructor(needs_backprop = true) {
    this.needs_backprop = needs_backprop;

    // this will store a list of functions that perform backprop,
    // in their forward pass order. So in backprop we will go
    // backwards and evoke each one
    this.backprop = [];
  }
  backward() {
    for(var i=this.backprop.length-1;i>=0;i--) {
      this.backprop[i](); // tick!
    }
  }
  rowPluck(m: Mat, ix: number) {
    // pluck a row of m with index ix and return it as col vector
    assert(ix >= 0 && ix < m.n);
    const d = m.d;
    const out = new Mat(d, 1);
    for(let i = 0, n = d; i < n; i++){ out.w[i] = m.w[d * ix + i]; } // copy over the data

    if (this.needs_backprop) {
      const backward = function() {
        for (let i = 0, n = d; i < n; i++){ m.dw[d * ix + i] += out.dw[i]; }
      }
      this.backprop.push(backward);
    }
    return out;
  }
  tanh(m: Mat) {
    // tanh nonlinearity
    var out = new Mat(m.n, m.d);
    var n = m.w.length;
    for(var i=0;i<n;i++) {
      // @ts-ignore
      out.w[i] = Math.tanh(m.w[i]);
    }

    if(this.needs_backprop) {
      var backward = function() {
        for(var i=0;i<n;i++) {
          // grad for z = tanh(x) is (1 - z^2)
          var mwi = out.w[i];
          m.dw[i] += (1.0 - mwi * mwi) * out.dw[i];
        }
      }
      this.backprop.push(backward);
    }
    return out;
  }
  sigmoid(m: Mat) {
    // sigmoid nonlinearity
    var out = new Mat(m.n, m.d);
    var n = m.w.length;
    for(var i=0;i<n;i++) {
      out.w[i] = sig(m.w[i]);
    }

    if(this.needs_backprop) {
      var backward = function() {
        for(var i=0;i<n;i++) {
          // grad for z = tanh(x) is (1 - z^2)
          var mwi = out.w[i];
          m.dw[i] += mwi * (1.0 - mwi) * out.dw[i];
        }
      }
      this.backprop.push(backward);
    }
    return out;
  }
  relu(m: Mat) {
    var out = new Mat(m.n, m.d);
    var n = m.w.length;
    for(var i=0;i<n;i++) {
      out.w[i] = Math.max(0, m.w[i]); // relu
    }
    if(this.needs_backprop) {
      var backward = function() {
        for(var i=0;i<n;i++) {
          m.dw[i] += m.w[i] > 0 ? out.dw[i] : 0.0;
        }
      }
      this.backprop.push(backward);
    }
    return out;
  }
  mul(m1: Mat, m2: Mat) {
    // multiply matrices m1 * m2
    assert(m1.d === m2.n, 'matmul dimensions misaligned');

    var n = m1.n;
    var d = m2.d;
    var out = new Mat(n,d);
    for(var i=0;i<m1.n;i++) { // loop over rows of m1
      for(var j=0;j<m2.d;j++) { // loop over cols of m2
        var dot = 0.0;
        for(var k=0;k<m1.d;k++) { // dot product loop
          dot += m1.w[m1.d*i+k] * m2.w[m2.d*k+j];
        }
        out.w[d*i+j] = dot;
      }
    }

    if(this.needs_backprop) {
      var backward = function() {
        for(var i=0;i<m1.n;i++) { // loop over rows of m1
          for(var j=0;j<m2.d;j++) { // loop over cols of m2
            for(var k=0;k<m1.d;k++) { // dot product loop
              var b = out.dw[d*i+j];
              m1.dw[m1.d*i+k] += m2.w[m2.d*k+j] * b;
              m2.dw[m2.d*k+j] += m1.w[m1.d*i+k] * b;
            }
          }
        }
      }
      this.backprop.push(backward);
    }
    return out;
  }
  add(m1: Mat, m2: Mat) {
    assert(m1.w.length === m2.w.length);

    var out = new Mat(m1.n, m1.d);
    for(var i=0,n=m1.w.length;i<n;i++) {
      out.w[i] = m1.w[i] + m2.w[i];
    }
    if(this.needs_backprop) {
      var backward = function() {
        for(var i=0,n=m1.w.length;i<n;i++) {
          m1.dw[i] += out.dw[i];
          m2.dw[i] += out.dw[i];
        }
      }
      this.backprop.push(backward);
    }
    return out;
  }
  dot(m1: Mat, m2: Mat) {
    // m1 m2 are both column vectors
    assert(m1.w.length === m2.w.length);
    var out = new Mat(1,1);
    var dot = 0.0;
    for(var i=0,n=m1.w.length;i<n;i++) {
      dot += m1.w[i] * m2.w[i];
    }
    out.w[0] = dot;
    if(this.needs_backprop) {
      var backward = function() {
        for(var i=0,n=m1.w.length;i<n;i++) {
          m1.dw[i] += m2.w[i] * out.dw[0];
          m2.dw[i] += m1.w[i] * out.dw[0];
        }
      }
      this.backprop.push(backward);
    }
    return out;
  }
  eltmul(m1: Mat, m2: Mat) {
    assert(m1.w.length === m2.w.length);

    var out = new Mat(m1.n, m1.d);
    for(var i=0,n=m1.w.length;i<n;i++) {
      out.w[i] = m1.w[i] * m2.w[i];
    }
    if(this.needs_backprop) {
      var backward = function() {
        for(var i=0,n=m1.w.length;i<n;i++) {
          m1.dw[i] += m2.w[i] * out.dw[i];
          m2.dw[i] += m1.w[i] * out.dw[i];
        }
      }
      this.backprop.push(backward);
    }
    return out;
  }

  softmax(m: Mat) {
    var out = new Mat(m.n, m.d); // probability volume
    var maxval = -999999;
    for(var i=0,n=m.w.length;i<n;i++) { if(m.w[i] > maxval) maxval = m.w[i]; }

    var s = 0.0;
    for(var i=0,n=m.w.length;i<n;i++) {
      out.w[i] = Math.exp(m.w[i] - maxval);
      s += out.w[i];
    }
    for(var i=0,n=m.w.length;i<n;i++) { out.w[i] /= s; }

    // no backward pass here needed
    // since we will use the computed probabilities outside
    // to set gradients directly on m
    return out;
  }
}
