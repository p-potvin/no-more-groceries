import { VaultMLKEM } from './ml-kem.js';

export const VaultPQC = {
  generateKeyPair: () => VaultMLKEM.generateKeyPair(),
  encapsulate: (pk) => VaultMLKEM.encapsulate(pk),
  decapsulate: (ct, sk) => VaultMLKEM.decapsulate(ct, sk)
};
