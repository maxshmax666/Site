"use client";

import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/calculator";
import { sampleGraph } from "@/lib/graph";

export function GraphWorkspace() {
  const [formula, setFormula] = useState("sin(x)");
  const [rangeX, setRangeX] = useState(10);
  const graph = useMemo(() => {
    try { return { data: sampleGraph(formula, rangeX), error: "" }; }
    catch (e) { return { data: null, error: e instanceof Error ? e.message : "Некорректная формула." }; }
  }, [formula, rangeX]);

  return <div className="graph-workspace">
    <label className="graph-label" htmlFor="graph-expression">Функция y =</label>
    <div className="graph-input-row">
      <input id="graph-expression" type="text" spellCheck={false} maxLength={110} autoComplete="off" value={formula} onChange={(e) => setFormula(e.target.value)} aria-describedby="graph-description" />
      <select aria-label="Диапазон по оси X" value={rangeX} onChange={(e) => setRangeX(Number(e.target.value))}>
        <option value={4}>±4</option><option value={10}>±10</option><option value={20}>±20</option><option value={50}>±50</option>
      </select>
    </div>
    <p className="graph-description" id="graph-description">Поддерживаются sin(x), cos(x), sqrt(abs(x)), x^2 и другие функции. Тригонометрия в радианах.</p>
    {graph.data ? <>
      <div className="plot-frame">
        <svg viewBox="0 0 700 300" className="plot-svg" role="img" aria-label={`График y = ${formula}; диапазон от минус ${rangeX} до плюс ${rangeX}`}>
          {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={20 + 82.5 * i} x2={20 + 82.5 * i} y1="20" y2="280" stroke="#333047" strokeWidth="1" />)}
          {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1="20" x2="680" y1={20 + 32.5 * i} y2={20 + 32.5 * i} stroke="#333047" strokeWidth="1" />)}
          <line x1="350" x2="350" y1="20" y2="280" stroke="#8377a6" strokeWidth="1.5" />
          <line x1="20" x2="680" y1="150" y2="150" stroke="#8377a6" strokeWidth="1.5" />
          <g fill="#aaa0c8" fontSize="13"><text x="24" y="145">−{rangeX}</text><text x="655" y="145">{rangeX}</text><text x="357" y="166">0</text><text x="358" y="27">{formatNumber(graph.data.rangeY)}</text></g>
          {graph.data.paths.map((path, index) => <path key={index} d={path} fill="none" stroke="#af8bff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />)}
        </svg>
      </div>
      <p className="graph-footnote">График — численная визуализация, {graph.data.validPoints} точек. Разрывы могут отображаться приблизительно.</p>
    </> : <p className="module-error" role="alert">{graph.error}</p>}
  </div>;
}
