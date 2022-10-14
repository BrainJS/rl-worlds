import { GridWorldDP } from "./grid-world-dp";
import $ from "jquery";
import "jquery-ui/dist/jquery-ui";
import "jquery-ui/dist/themes/base/jquery-ui.min.css";
// import "bootstrap/dist/js/bootstrap.min";
import "bootstrap/dist/css/bootstrap.min.css";
import "jquery.flot";
import hljs from "highlight.js";
import { marked } from "marked";
import { select } from "d3";

import { WorldAgent } from "./agents/world-agent";
import * as d3 from "d3";
import {highlightTex} from "../highlight-tex";
import "../style.css";

type D3Line = d3.Selection<SVGLineElement, unknown, HTMLElement, null>;
type D3Rect = d3.Selection<SVGRectElement, unknown, HTMLElement, null>;
type D3Text = d3.Selection<SVGTextElement, unknown, HTMLElement, null>;

hljs.highlightAll();

let agent: WorldAgent;
let world: GridWorldDP;
const gh = 10;  // height in cells
const gw = 10; // width in cells
const gs = gw * gh; // total number of cells
const staticOpts = {
  numStates: gs,
  maxNumActions: 4,
  gamma: 0.9,
  gw,
  gh,
  gs,
};

// ------
// UI
// ------
let rs: { [key: number]: D3Rect } = {};
let trs: { [key: number]: D3Text } = {};
let tvs: { [key: number]: D3Text } = {};
let pas: { [key: number]: D3Line[] } = {};
const cs = 60;  // cell size
function initGrid() {
  const d3elt = select('#draw');
  d3elt.html('');
  rs = {};
  trs = {};
  tvs = {};
  pas = {};

  const w = 600;
  const h = 600;
  const svg = d3elt
    .append('svg')
      .attr('width', w)
      .attr('height', h)
        .append('g')
          .attr('transform', 'scale(1)');

  // define a marker for drawing arrowheads
  svg.append("defs")
    .append("marker")
    .attr("id", "arrowhead")
    .attr("refX", 3)
    .attr("refY", 2)
    .attr("markerWidth", 3)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0,0 V 4 L3,2 Z");

  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const xcoord = x*cs;
      const ycoord = y*cs;
      const s = agent.xytos(x, y);

      const g = svg.append('g');
      // click callbackfor group
      g.on('click', function(ss) {
        return function() { cellClicked(ss); } // close over s
      }(s));

      // set up cell rectangles
      const r = g.append('rect')
        .attr('x', xcoord)
        .attr('y', ycoord)
        .attr('height', cs)
        .attr('width', cs)
        .attr('fill', '#FFF')
        .attr('stroke', 'black')
        .attr('stroke-width', 2);
      rs[s] = r;

      // reward text
      const tr = g.append('text')
        .attr('x', xcoord + 5)
        .attr('y', ycoord + 55)
        .attr('font-size', 10)
        .text('');
      trs[s] = tr;

      // skip rest for cliffs
      if (agent.T[s] === 1) { continue; }

      // value text
       const tv = g.append('text')
        .attr('x', xcoord + 5)
        .attr('y', ycoord + 20)
        .text('');
      tvs[s] = tv;

      // policy arrows
      pas[s] = []
      for (let a = 0; a < 4; a++) {
        let pa = g.append('line')
          .attr('x1', xcoord)
          .attr('y1', ycoord)
          .attr('x2', xcoord)
          .attr('y2', ycoord)
          .attr('stroke', 'black')
          .attr('stroke-width', '2')
          .attr("marker-end", "url(#arrowhead)");
        pas[s].push(pa);
      }
    }
  }

}

function drawGrid() {
  // updates the grid with current state of world/agent
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const xcoord = x*cs;
      const ycoord = y*cs;
      let r = 255;
      let g = 255;
      let b = 255;
      const s = agent.xytos(x, y);

      const vv = agent.V[s];
      const ms = 100;
      if (vv > 0) { g = 255; r = 255 - vv*ms; b = 255 - vv*ms; }
      if (vv < 0) { g = 255 + vv*ms; r = 255; b = 255 + vv*ms; }
      let vcol = 'rgb('+Math.floor(r)+','+Math.floor(g)+','+Math.floor(b)+')';
      let rcol = '';
      if (agent.T[s] === 1) { vcol = "#AAA"; rcol = "#AAA"; }

      // update colors of rectangles based on value
      const rec = rs[s];
      if(s === selected) {
        // highlight selected cell
        rec.attr('fill', '#FF0');
      } else {
        rec.attr('fill', vcol);
      }

      // write reward texts
      const rv = agent.Rarr[s];
      const tr = trs[s];
      if (rv !== 0) {
        tr.text('R ' + rv.toFixed(1))
      }

      // skip rest for cliff
      if (agent.T[s] === 1) continue;

      // write value
      const tv = tvs[s];
      tv.text(agent.V[s].toFixed(2));

      // update policy arrows
      const paa = pas[s];
      for(let a = 0; a < 4; a++) {
        const pa = paa[a];
        const prob = agent.P[a*gs+s];
        if (prob === 0) { pa.attr('visibility', 'hidden'); }
        else { pa.attr('visibility', 'visible'); }
        let ss = cs/2 * prob * 0.9;
        let ns = 0;
        let ny = 0;
        let nx = 0;
        if (a === 0) { nx=-ss; ny=0; }
        if (a === 1) { nx=0; ny=-ss; }
        if (a === 2) { nx=0; ny=ss; }
        if (a === 3) { nx=ss; ny=0; }
        pa.attr('x1', xcoord+cs/2)
          .attr('y1', ycoord+cs/2)
          .attr('x2', xcoord+cs/2+nx)
          .attr('y2', ycoord+cs/2+ny);
      }
    }
  }
}

let selected = -1;
function cellClicked(s: number) {
  if (s === selected) {
    selected = -1; // toggle off
    $("#creward").html('(select a cell)');
  } else {
    selected = s;
    $("#creward").html(agent.Rarr[s].toFixed(2));
    $("#rewardslider").slider('value', agent.Rarr[s]);
  }
  drawGrid(); // redraw
}

function updatePolicy () {
  agent.updatePolicy();
  drawGrid();
}

function evaluatePolicy() {
  agent.evaluatePolicy();
  drawGrid();
}

let sid: NodeJS.Timer | number = -1;
function runValueIteration() {
  if (sid === -1) {
    sid = setInterval(function(){
      agent.evaluatePolicy();
      agent.updatePolicy();
      drawGrid();
    }, 100);
  } else {
    clearInterval(sid);
    sid = -1;
  }
}

function resetAll() {
  world = new GridWorldDP();
  agent = new WorldAgent(staticOpts);
  drawGrid();
}

$(function start() {
  world = new GridWorldDP(); // create environment
  agent = new WorldAgent(staticOpts); // create an agent, yay!
  initGrid();
  drawGrid();

  $("#rewardslider").slider({
    min: -5,
    max: 5.1,
    value: 0,
    step: 0.1,
    slide: function(event, ui) {
      if(selected >= 0 && typeof ui.value === 'number') {
        agent.Rarr[selected] = ui.value;
        $("#creward").html(ui.value.toFixed(2));
        drawGrid();
      } else {
        $("#creward").html('(select a cell)');
      }
    }
  });

  $('#evaluate-policy').on('click', evaluatePolicy);
  $('#update-policy').on('click', updatePolicy);
  $('#run-value-iteration').on('click', runValueIteration);
  $('#reset-all').on('click', resetAll);

  // suntax highlighting
  //marked.setOptions({highlight:function(code){ return hljs.highlightAuto(code).value; }});
  $(".md").each(function(){
    $(this).html(marked($(this).html()));
  });
  highlightTex();
});
