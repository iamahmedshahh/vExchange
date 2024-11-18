// MetaMaskService.js
export default class MetaMaskService {
  constructor() {
    this.address = null;
  }

  async connect() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.address = accounts[0];
        return this.address;
      } catch (error) {
        console.error("MetaMask connection failed:", error);
      }
    } else {
      console.error("MetaMask is not installed.");
    }
    return null;
  }

  getAddress() {
    return this.address;
  }
}
