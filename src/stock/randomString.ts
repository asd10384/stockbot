import { random } from "./getimg";

export default function randomString(): string {
  let count = 10;
  let list = "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z".split(",");
  let str = '';
  for (let i=0; i<2; i++) {
    str += list[Math.floor(Math.random() * list.length)];
  }
  for (let i=0; i<count; i++) {
    str += Math.floor(Math.random() * 36).toString(36);
  }
  return str;
}

export function randomString_notsame(): string {
  let count = 10;
  let str = '';
  while (true) {
    for (let i=0; i<count; i++) {
      str += Math.floor(Math.random() * 36).toString(36);
    }
    if (!random.has(str+".jpg")) break;
  }
  random.add(str+".jpg");
  return str;
}