import React from "react";
import Svg, { Path, Circle, Rect, Line } from "react-native-svg";
import { colors } from "@yava/shared";

/**
 * Íconos de línea del diseño (35 Cuenta, 39 Ayuda, 31/32 Envíos, 48): trazo redondeado ≈ 1,75 de 24,
 * dibujados aquí porque Ionicons no tiene la portapapeles con lista, el tiquete con línea punteada,
 * la tienda con toldo ni la moto de reparto del PNG.
 */
export type LineIconName =
  | "clipboard" | "pin" | "card" | "ticket" | "bell" | "help" | "settings" | "store" | "moped"
  | "box" | "receipt" | "user" | "shield" | "pencil" | "headset";

export function LineIcon({ name, size = 32, color = colors.blue, stroke = 1.75 }: { name: LineIconName; size?: number; color?: string; stroke?: number }) {
  const p = { stroke: color, strokeWidth: stroke, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  let body: React.ReactNode = null;
  switch (name) {
    case "clipboard":
      body = (
        <>
          <Rect x={5.6} y={5.4} width={12.8} height={15} rx={2.2} {...p} />
          <Path d="M9.6 5.4V5Q9.6 4.2 10.4 4.2H10.9Q11 3 12 3Q13 3 13.1 4.2H13.6Q14.4 4.2 14.4 5V5.4" {...p} />
          <Line x1={9} y1={11} x2={9.05} y2={11} {...p} strokeWidth={stroke * 1.25} />
          <Line x1={11.6} y1={11} x2={15.2} y2={11} {...p} />
          <Line x1={9} y1={14.8} x2={9.05} y2={14.8} {...p} strokeWidth={stroke * 1.25} />
          <Line x1={11.6} y1={14.8} x2={15.2} y2={14.8} {...p} />
        </>
      );
      break;
    case "pin":
      body = (
        <>
          <Path d="M12 20.4Q5.7 14.5 5.7 10Q5.7 4.2 12 4.2Q18.3 4.2 18.3 10Q18.3 14.5 12 20.4Z" {...p} />
          <Circle cx={12} cy={10} r={2.2} {...p} />
        </>
      );
      break;
    case "card":
      body = (
        <>
          <Rect x={3.2} y={4.6} width={17.6} height={13.2} rx={2.3} {...p} />
          <Line x1={3.2} y1={8.6} x2={20.8} y2={8.6} {...p} />
          <Line x1={6.8} y1={14.2} x2={8.6} y2={14.2} {...p} />
        </>
      );
      break;
    case "ticket":
      body = (
        <>
          <Path d="M4.9 4.9H19.1Q21.2 4.9 21.2 7V9.4A2.6 2.6 0 0 0 21.2 14.6V17Q21.2 19.1 19.1 19.1H4.9Q2.8 19.1 2.8 17V14.6A2.6 2.6 0 0 0 2.8 9.4V7Q2.8 4.9 4.9 4.9Z" {...p} />
          <Line x1={12} y1={7.4} x2={12} y2={8.4} {...p} />
          <Line x1={12} y1={11.5} x2={12} y2={12.5} {...p} />
          <Line x1={12} y1={15.6} x2={12} y2={16.6} {...p} />
        </>
      );
      break;
    case "bell":
      body = (
        <>
          <Path d="M12 3.6Q7.4 3.6 7.4 9.2V13.2L5.6 16.6H18.4L16.6 13.2V9.2Q16.6 3.6 12 3.6Z" {...p} />
          <Path d="M10 16.8Q10 19.6 12 19.6Q14 19.6 14 16.8" {...p} />
          <Line x1={12} y1={2.6} x2={12} y2={3.6} {...p} />
        </>
      );
      break;
    case "help":
      body = (
        <>
          <Circle cx={12} cy={12} r={8.4} {...p} />
          <Path d="M9.7 9.9Q9.7 7.7 12 7.7Q14.3 7.7 14.3 9.7Q14.3 11 12.9 11.6Q12 12 12 13.3" {...p} />
          <Line x1={12} y1={16.1} x2={12} y2={16.15} {...p} strokeWidth={stroke * 1.3} />
        </>
      );
      break;
    case "settings":
      body = (
        <>
          <Path d="M10.33 4.32c.43-1.76 2.92-1.76 3.35 0a1.72 1.72 0 0 0 2.57 1.07c1.54-.94 3.31.83 2.37 2.37a1.72 1.72 0 0 0 1.07 2.57c1.76.43 1.76 2.92 0 3.35a1.72 1.72 0 0 0-1.07 2.57c.94 1.54-.83 3.31-2.37 2.37a1.72 1.72 0 0 0-2.57 1.07c-.43 1.76-2.92 1.76-3.35 0a1.72 1.72 0 0 0-2.57-1.07c-1.54.94-3.31-.83-2.37-2.37a1.72 1.72 0 0 0-1.07-2.57c-1.76-.43-1.76-2.92 0-3.35a1.72 1.72 0 0 0 1.07-2.57c-.94-1.54.83-3.31 2.37-2.37c1 .61 2.3.07 2.57-1.07z" {...p} />
          <Circle cx={12} cy={12} r={2.6} {...p} />
        </>
      );
      break;
    case "store":
      body = (
        <>
          <Path d="M5.4 4H18.6L20.4 8.4Q20.4 10.6 18.3 10.6Q16.2 10.6 16.2 8.6Q16.2 10.6 14.1 10.6Q12 10.6 12 8.6Q12 10.6 9.9 10.6Q7.8 10.6 7.8 8.6Q7.8 10.6 5.7 10.6Q3.6 10.6 3.6 8.4Z" {...p} />
          <Line x1={3.8} y1={8.6} x2={20.2} y2={8.6} {...p} />
          <Path d="M5.4 10.6V19.4Q5.4 20.2 6.2 20.2H17.8Q18.6 20.2 18.6 19.4V10.6" {...p} />
          <Path d="M9.6 20.2V16.3Q9.6 13.9 12 13.9Q14.4 13.9 14.4 16.3V20.2" {...p} />
        </>
      );
      break;
    case "moped":
      body = (
        <>
          <Rect x={6} y={6.9} width={5.9} height={3.6} rx={0.8} {...p} />
          <Path d="M3 10.5H11.8Q13 15.8 16.4 15.8" {...p} />
          <Path d="M4.5 10.5Q4.5 15.8 6.6 15.8H22.6" {...p} />
          <Path d="M4.7 15.8A2.4 2.4 0 0 0 9.5 15.8M16.3 15.8A2.4 2.4 0 0 0 21.1 15.8" {...p} />
          <Path d="M14.6 5.8L18 15.2" {...p} />
          <Path d="M16.6 15.6Q17.2 12.3 19.8 12.3Q22.5 12.3 22.6 15.8" {...p} />
          <Rect x={13.4} y={3.6} width={5} height={2.3} rx={1.15} {...p} />
        </>
      );
      break;
    case "box":
      body = (
        <>
          <Path d="M12 3.2L19.8 7.4V16.6L12 20.8L4.2 16.6V7.4Z" {...p} />
          <Path d="M4.2 7.4L12 11.6L19.8 7.4M12 11.6V20.8M8.1 5.3L15.9 9.5" {...p} />
        </>
      );
      break;
    case "receipt":
      body = (
        <>
          <Path d="M6 3.4H18V20.6L15.6 19.2L13.2 20.6L10.8 19.2L8.4 20.6L6 19.2Z" {...p} />
          <Line x1={9} y1={8} x2={15} y2={8} {...p} />
          <Line x1={9} y1={11.4} x2={15} y2={11.4} {...p} />
          <Line x1={9} y1={14.8} x2={12.6} y2={14.8} {...p} />
        </>
      );
      break;
    case "user":
      body = (
        <>
          <Circle cx={12} cy={8} r={3.8} {...p} />
          <Path d="M5 20.2Q5 14.6 12 14.6Q19 14.6 19 20.2" {...p} />
        </>
      );
      break;
    case "pencil":
      body = (
        <>
          <Path d="M4.6 19.4L5.3 15.6L15.6 5.3Q16.9 4 18.2 5.3L18.7 5.8Q20 7.1 18.7 8.4L8.4 18.7Z" {...p} />
          <Path d="M14.2 6.7L17.3 9.8" {...p} />
        </>
      );
      break;
    case "headset":
      body = (
        <>
          <Path d="M4.8 14V11.6Q4.8 4.4 12 4.4Q19.2 4.4 19.2 11.6V14" {...p} />
          <Rect x={3.6} y={11.6} width={3.4} height={6} rx={1.5} fill={color} stroke={color} strokeWidth={stroke * 0.6} />
          <Rect x={17} y={11.6} width={3.4} height={6} rx={1.5} fill={color} stroke={color} strokeWidth={stroke * 0.6} />
          <Path d="M18.7 17.6Q18.7 20.2 15.4 20.2H13.4" {...p} />
          <Circle cx={12.4} cy={20.2} r={1.25} fill={color} stroke="none" />
        </>
      );
      break;
    case "shield":
      body = (
        <>
          <Path d="M12 3L19 5.8V11.4Q19 17.4 12 21Q5 17.4 5 11.4V5.8Z" {...p} />
          <Path d="M9 12.2L11.1 14.2L15.2 10" {...p} />
        </>
      );
      break;
  }
  return <Svg width={size} height={size} viewBox="0 0 24 24">{body}</Svg>;
}
