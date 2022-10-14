import { RandMat } from "./rand-mat";
import { Mat } from "./mat";
import { Graph } from "./graph";

export interface ILstmModelLayer {
  Wix: Mat;
  Wih: Mat;
  bi: Mat;
  Wfx: Mat;
  Wfh: Mat;
  bf: Mat;
  Wox: Mat;
  Woh: Mat;
  bo: Mat;
  Wcx: Mat;
  Wch: Mat;
  bc: Mat;
}

export interface ILstmModel {
  layers: ILstmModelLayer[];
  Whd: Mat;
  bd: Mat;
}

export interface ILSTMCell {
  h: Mat[];
  c: Mat[];
  o: Mat;
}

export class LSTM {
  model: ILstmModel;
  constructor(input_size: number, hidden_sizes: number[], output_size: number) {
    const layers: ILstmModelLayer[] = [];
    for (let d = 0; d < hidden_sizes.length; d++) { // loop over depths
      const prev_size = d === 0 ? input_size : hidden_sizes[d - 1];
      const hidden_size = hidden_sizes[d];
      layers.push({
        // gates parameters
        Wix: new RandMat(hidden_size, prev_size , 0, 0.08),
        Wih: new RandMat(hidden_size, hidden_size , 0, 0.08),
        bi: new Mat(hidden_size, 1),
        Wfx: new RandMat(hidden_size, prev_size , 0, 0.08),
        Wfh: new RandMat(hidden_size, hidden_size , 0, 0.08),
        bf: new Mat(hidden_size, 1),
        Wox: new RandMat(hidden_size, prev_size , 0, 0.08),
        Woh: new RandMat(hidden_size, hidden_size , 0, 0.08),
        bo: new Mat(hidden_size, 1),
        // cell write params
        Wcx: new RandMat(hidden_size, prev_size , 0, 0.08),
        Wch: new RandMat(hidden_size, hidden_size , 0, 0.08),
        bc: new Mat(hidden_size, 1),
      });
    }
    this.model = {
      layers,
      Whd: new RandMat(output_size, hidden_sizes.length - 1, 0, 0.08),
      bd: new Mat(output_size, 1),
    };
  }

  forward(G: Graph, hidden_sizes: number[], x: Mat, prev: null | ILSTMCell): ILSTMCell {
    const { model } = this;
    // forward prop for a single tick of LSTM
    // G is graph to append ops to
    // model contains LSTM parameters
    // x is 1D column vector with observation
    // prev is a struct containing hidden and cell
    // from previous iteration

    let hidden_prevs: Mat[];
    let cell_prevs: Mat[];
    if (prev === null || typeof prev.h === 'undefined') {
      hidden_prevs = [];
      cell_prevs = [];
      for(let d=0;d<hidden_sizes.length;d++) {
        hidden_prevs.push(new Mat(hidden_sizes[d],1));
        cell_prevs.push(new Mat(hidden_sizes[d],1));
      }
    } else {
      hidden_prevs = prev.h;
      cell_prevs = prev.c;
    }

    const hidden = [];
    const cell = [];
    for(let d = 0 ; d < hidden_sizes.length; d++) {
      const layer = model.layers[d];
      const input_vector = d === 0 ? x : hidden[d-1];
      const hidden_prev = hidden_prevs[d];
      const cell_prev = cell_prevs[d];

      // input gate
      const h0 = G.mul(layer.Wix, input_vector);
      const h1 = G.mul(layer.Wih, hidden_prev);
      const input_gate = G.sigmoid(G.add(G.add(h0,h1),layer.bi));

      // forget gate
      const h2 = G.mul(layer.Wfx, input_vector);
      const h3 = G.mul(layer.Wfh, hidden_prev);
      const forget_gate = G.sigmoid(G.add(G.add(h2, h3),layer.bf));

      // output gate
      const h4 = G.mul(layer.Wox, input_vector);
      const h5 = G.mul(layer.Woh, hidden_prev);
      const output_gate = G.sigmoid(G.add(G.add(h4, h5),layer.bo));

      // write operation on cells
      const h6 = G.mul(layer.Wcx, input_vector);
      const h7 = G.mul(layer.Wch, hidden_prev);
      const cell_write = G.tanh(G.add(G.add(h6, h7),layer.bc));

      // compute new cell activation
      const retain_cell = G.eltmul(forget_gate, cell_prev); // what do we keep from cell
      const write_cell = G.eltmul(input_gate, cell_write); // what do we write to cell
      const cell_d = G.add(retain_cell, write_cell); // new cell contents

      // compute hidden state as gated, saturated cell activations
      const hidden_d = G.eltmul(output_gate, G.tanh(cell_d));

      hidden.push(hidden_d);
      cell.push(cell_d);
    }

    // one decoder to outputs at end
    const output = G.add(G.mul(this.model.Whd, hidden[hidden.length - 1]),this.model.bd);

    // return cell memory, hidden representation and output
    return {
      h: hidden,
      c: cell,
      o: output,
    };
  }

  update(alpha: number) {
    const { layers, Whd, bd } = this.model;
    for (let d = 0; d < layers.length; d++) { // loop over depths
      const layer = layers[d];
      layer.Wix.update(alpha);
      layer.Wih.update(alpha);
      layer.bi.update(alpha);
      layer.Wfx.update(alpha);
      layer.Wfh.update(alpha);
      layer.bf.update(alpha);
      layer.Wox.update(alpha);
      layer.Woh.update(alpha);
      layer.bo.update(alpha);
      layer.Wcx.update(alpha);
      layer.Wch.update(alpha);
      layer.bc.update(alpha);
    }
    Whd.update(alpha);
    bd.update(alpha);
  }
}
