import { GridWorldTD } from "./grid-world-td";
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

hljs.highlightAll();

type D3Line = d3.Selection<SVGLineElement, unknown, HTMLElement, null>;
type D3Rect = d3.Selection<SVGRectElement, unknown, HTMLElement, null>;
type D3Text = d3.Selection<SVGTextElement, unknown, HTMLElement, null>;

const gh = 10; // height in cells
const gw = 10; // width in cells
const gs = gh * gw; // total number of cells
const staticOpts = {
  numStates: 100,
  maxNumActions: 4,
  gh,
  gw,
  gs,
};
// ------
// UI
// ------
let rs: { [key: number]: D3Rect } = {};
let trs: { [key: number]: D3Text } = {};
let tvs: { [key: number]: D3Text } = {};
let pas: { [key: number]: D3Line[] } = {};
let cs = 60;  // cell size
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
        const pa = g.append('line')
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

  // append agent position circle
  svg.append('circle')
    .attr('cx', -100)
    .attr('cy', -100)
    .attr('r', 15)
    .attr('fill', '#FF0')
    .attr('stroke', '#000')
    .attr('id', 'cpos');

}

function drawGrid() {
  const sx = agent.stox(state);
  const sy = agent.stoy(state);
  select('#cpos')
    .attr('cx', sx * cs + cs / 2)
    .attr('cy', sy * cs + cs / 2);

  // updates the grid with current state of world/agent
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const xcoord = x*cs;
      const ycoord = y*cs;
      let r = 255;
      let g = 255;
      let b = 255;
      const s = agent.xytos(x,y);
      let vv: number = 0;
      // get value of state s under agent policy
      if (typeof agent.V !== 'undefined') {
        vv = agent.V[s];
      } else if (typeof agent.Q !== 'undefined' && agent.Q.length > 0){
        const poss = agent.allowedActions(s);
        vv = -1;
        for(let i = 0, n = poss.length; i < n; i++) {
          const qsa = agent.Q[poss[i]*gs+s];
          if (i === 0 || qsa > vv) {
            vv = qsa;
          }
        }
      }

      // var poss = env.allowedActions(s);
      // var vv = -1;
      // for(var i=0,n=poss.length;i<n;i++) {
      //   var qsa = agent.e[poss[i]*gs+s];
      //   if(i === 0 || qsa > vv) { vv = qsa; }
      // }

      const ms = 100;
      if (vv > 0) { g = 255; r = 255 - vv * ms; b = 255 - vv * ms; }
      if (vv < 0) { g = 255 + vv * ms; r = 255; b = 255 + vv * ms; }
      let vcol = 'rgb('+Math.floor(r)+','+Math.floor(g)+','+Math.floor(b)+')';
      let rcol: string;
      if (agent.T[s] === 1) { vcol = "#AAA"; rcol = "#AAA"; }
      {
        // update colors of rectangles based on value
        const r = rs[s];
        if (s === selected) {
          // highlight selected cell
          r.attr('fill', '#FF0');
        } else {
          r.attr('fill', vcol);
        }
      }

      // write reward texts
      let rv = agent.Rarr[s];
      const tr = trs[s];
      if (rv !== 0) {
        tr.text('R ' + rv.toFixed(1))
      }

      // skip rest for cliff
      if (agent.T[s] === 1) continue;

      // write value
      const tv = tvs[s];
      tv.text(vv.toFixed(2));

      // update policy arrows
      const paa = pas[s];
      for (let a = 0; a < 4; a++) {
        const pa = paa[a];
        const prob = agent.P[a * gs + s];
        if (typeof prob === 'undefined') throw 'prob is undefined';
        if (prob < 0.01) {
          pa.attr('visibility', 'hidden');
        } else {
          pa.attr('visibility', 'visible');
        }
        const ss = cs / 2 * prob * 0.9;
        let nx = 0;
        let ny = 0;
        if (a === 0) { nx = -ss; ny = 0; }
        if (a === 1) { nx = 0; ny =- ss; }
        if (a === 2) { nx = 0; ny = ss; }
        if (a === 3) { nx = ss; ny = 0; }
        pa.attr('x1', xcoord + cs / 2)
          .attr('y1', ycoord + cs / 2)
          .attr('x2', xcoord + cs / 2 + nx)
          .attr('y2', ycoord + cs / 2 + ny);
      }
    }
  }
}

let selected: number = -1;
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

function goslow() {
  steps_per_tick = 1;
}
function gonormal(){
  steps_per_tick = 10;
}
function gofast() {
  steps_per_tick = 25;
}
let steps_per_tick = 1;
let sid: NodeJS.Timer | number = -1;
let nsteps_history: number[] = [];
let nsteps_counter = 0;
let nflot = 1000;
function tdlearn() {
  if (sid === -1) {
    sid = setInterval(function(){
      for (let k = 0; k < steps_per_tick; k++) {
        const a = agent.act(state); // ask agent for an action
        const obs = agent.sampleNextState(state, a); // run it through environment dynamics
        agent.learn(obs.r); // allow opportunity for the agent to learn
        state = obs.ns; // evolve environment to next state
        nsteps_counter += 1;
        if (typeof obs.reset_episode !== 'undefined') {
          agent.resetEpisode();
          // record the reward achieved
          if (nsteps_history.length >= nflot) {
            nsteps_history = nsteps_history.slice(1);
          }
          nsteps_history.push(nsteps_counter);
          nsteps_counter = 0;
        }
      }
      // keep track of reward history
      drawGrid(); // draw
    }, 20);
  } else {
    clearInterval(sid);
    sid = -1;
  }
}

function resetAgent() {
  const spec = safeJson("#agentspec");
  agent = new WorldAgent({
    ...spec,
    ...staticOpts,
  });
  $("#slider").slider('value', agent.epsilon);
  $("#eps").html(agent.epsilon.toFixed(2));
  state = agent.startState(); // move state to beginning too
  drawGrid();
}

function safeJson(selector: string) {
  const json = $(selector).val();
  return JSON.parse((json || '').toString());
}

function resetAll() {
  const spec = safeJson("#agentspec");
  agent = new WorldAgent({
    ...spec,
    ...staticOpts,
  });
  drawGrid();
}

function initGraph() {
  const container = $("#flotreward");
  const res = getFlotRewards();
  const series = [{
    data: res,
    lines: { fill: true }
  }];
  const plot = $.plot(container, series, {
    grid: {
      borderWidth: 1,
      minBorderMargin: 20,
      labelMargin: 10,
      backgroundColor: {
        colors: ["#FFF", "#e4f4f4"]
      },
      margin: {
        top: 10,
        bottom: 10,
        left: 10,
      }
    },
    xaxis: {
      min: 0,
      max: nflot
    },
    yaxis: {
      min: 0,
      max: 1000
    }
  });

  setInterval(function(){
    series[0].data = getFlotRewards();
    plot.setData(series);
    plot.draw();
  }, 100);
}
function getFlotRewards() {
  // zip rewards into flot data
  const res = [];
  for(let i = 0, n = nsteps_history.length; i < n; i++) {
    res.push([i, nsteps_history[i]]);
  }
  return res;
}

let state = 0;
let agent:WorldAgent;
let world = new GridWorldTD();
$(function start() {
  $("#reset-agent").on("click", resetAgent);
  $("#td-learn").on("click", tdlearn);
  $("#go-fast").on("click", gofast);
  $("#go-normal").on("click", gonormal);
  $("#go-slow").on("click", goslow);
  world = new GridWorldTD(); // create environment
  const spec = safeJson("#agentspec");
  agent = new WorldAgent({
    ...spec,
    ...staticOpts,
  });
  state = agent.startState();
  //agent = new RL.ActorCriticAgent(env, {'gamma':0.9, 'epsilon':0.2});

  // slider sets agent epsilon
  $( "#slider" ).slider({
    min: 0,
    max: 1,
    value: agent.epsilon,
    step: 0.01,
    slide: function(event, ui) {
      const value = ui.value || 0;
      agent.epsilon = value;
      $("#eps").html(value.toFixed(2));
    }
  });

  $("#rewardslider").slider({
    min: -5,
    max: 5.1,
    value: 0,
    step: 0.1,
    slide: function(event, ui) {
      if (selected >= 0 && typeof ui.value !== "undefined") {
        const value = agent.Rarr[selected] = ui.value;
        $("#creward").html(value.toFixed(2));
        drawGrid();
      } else {
        $("#creward").html('(select a cell)');
      }
    }
  });

  $("#eps").html(agent.epsilon.toFixed(2));
  $("#slider").slider('value', agent.epsilon);

  // render markdown
  $(".md").each(function(){
    $(this).html(marked($(this).html()));
  });
  highlightTex();

  initGrid();
  drawGrid();
  initGraph();
});
