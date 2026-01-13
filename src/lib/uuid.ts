const smallLetters = "abcdefghijklmnopqrstuvwxyz";

const randDigit = () => crypto.getRandomValues(new Uint8Array(1))[0] % 10;
const randLetter = () =>
  smallLetters[
    crypto.getRandomValues(new Uint8Array(1))[0] % smallLetters.length
  ];

export const uuid: () => string = () => {
  const d = Array.from({ length: 3 }, randDigit);
  const s = Array.from({ length: 6 }, randLetter);

  return `${d[0]}${s[0]}${s[3]}${d[2]}${s[5]}${s[1]}${d[1]}${s[2]}${s[4]}`;
};
