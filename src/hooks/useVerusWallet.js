import { ref, onMounted } from 'vue';

// Track pending currency request
let currencyRequestPromise = null;

/**
 * Hook for interacting with the Verus wallet extension
 * @returns {Object} Hook methods and state
 */
export function useVerusWallet() {
    const address = ref(null);
    const balances = ref({});
    const isConnected = ref(false);
    const isInstalled = ref(false);
    const error = ref(null);
    const currencies = ref([]);
    const network = ref({ isTestnet: true });
    const loading = ref(false);

    // Initialize state
    const checkExtension = async () => {
        isInstalled.value = typeof window.verus !== 'undefined';
        if (isInstalled.value) {
            isConnected.value = window.verus.isConnected;
            if (isConnected.value) {
                address.value = window.verus.address;
                await getCurrencies();
            }
        }
    };

    const getCurrencies = async () => {
        try {
            // If there's already a request in progress, return that promise
            if (currencyRequestPromise) {
                console.log('[useVerusWallet] Using existing currency request');
                return currencyRequestPromise;
            }

            error.value = null;
            
            // Create new request promise
            currencyRequestPromise = (async () => {
                try {
                    // Check if window.verus is available
                    if (!window.verus) {
                        throw new Error('Verus provider not available');
                    }

                    // Get currencies list
                    const currencyList = await window.verus.getCurrencies();
                    console.log('[useVerusWallet] Got currency list:', currencyList);
                    
                    if (!currencyList || !Array.isArray(currencyList)) {
                        throw new Error('Invalid currency data received');
                    }

                    // Update currencies list with all available currencies
                    currencies.value = currencyList;
                    
                    // Update balances for all currencies
                    if (isConnected.value) {
                        const newBalances = {};
                        currencyList.forEach(currency => {
                            if (currency.currencyid) {
                                newBalances[currency.currencyid] = currency.balance || '0';
                            }
                        });
                        balances.value = newBalances;
                    }

                    return currencyList;
                } finally {
                    // Clear the promise reference after a short delay
                    setTimeout(() => {
                        currencyRequestPromise = null;
                    }, 1000); // 1 second cooldown before allowing new requests
                }
            })();

            return currencyRequestPromise;
        } catch (err) {
            error.value = err.message;
            console.error('[useVerusWallet] Error getting currencies:', err);
            throw err;
        }
    };

    const connect = async () => {
        try {
            loading.value = true;
            error.value = null;
            await window.verus.connect();
            isConnected.value = true;
            address.value = window.verus.address;
            await getCurrencies();
        } catch (err) {
            error.value = err.message;
            console.error('Error connecting wallet:', err);
            isConnected.value = false;
            address.value = null;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const disconnect = async () => {
        try {
            loading.value = true;
            error.value = null;
            await window.verus.disconnect();
            isConnected.value = false;
            address.value = null;
            currencies.value = [];
            balances.value = {};
        } catch (err) {
            error.value = err.message;
            console.error('Error disconnecting wallet:', err);
        } finally {
            loading.value = false;
        }
    };

    const getBalance = async (currency) => {
        try {
            if (!isConnected.value) return '0';
            error.value = null;
            const balance = await window.verus.getBalance(currency);
            if (balance !== undefined) {
                balances.value = {
                    ...balances.value,
                    [currency]: balance
                };
                return balance;
            }
            return '0';
        } catch (err) {
            error.value = err.message;
            console.error('Error getting balance:', err);
            return '0';
        }
    };

    // Check connection status on mount
    onMounted(async () => {
        await checkExtension();
    });

    return {
        isConnected,
        isInstalled,
        address,
        network,
        connect,
        disconnect,
        getCurrencies,
        getBalance,
        balances,
        currencies,
        loading,
        error
    };
}
