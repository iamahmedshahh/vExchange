import { VerusIdInterface, primitives } from 'verusid-ts-client';
import QRCode from 'qrcode';
import axios from 'axios';
import crypto from 'crypto';

const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY;
const SIGNING_IADDRESS = import.meta.env.VITE_SIGNING_IADDRESS;
const CHAIN = import.meta.env.VITE_CHAIN;
const API = import.meta.env.VITE_APP_API;
const CHAIN_IADDRESS = import.meta.env.VITE_APP_CHAIN_IADDRESS;
const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const I_ADDRESS_VERSION = 102;
const verusId = new VerusIdInterface(CHAIN, API);

function generateChallengeID(len = 20) {
  const randomBytes = crypto.randomBytes(len);
  const challengeId = primitives.toBase58Check(randomBytes, I_ADDRESS_VERSION);
  return challengeId;
}

export async function generateLogin() {
  const challengeId = generateChallengeID();

  try {
    const response = await verusId.createLoginConsentRequest(
      SIGNING_IADDRESS,
      new primitives.LoginConsentChallenge({
        challenge_id: challengeId,
        requested_access: [new primitives.RequestedPermission(primitives.IDENTITY_VIEW.vdxfid)],
        redirect_uris: [new primitives.RedirectUri(`${SERVER_URL}/verusidlogin`, primitives.LOGIN_CONSENT_WEBHOOK_VDXF_KEY.vdxfid)],
        created_at: Math.floor(Date.now() / 1000),
      }),
      PRIVATE_KEY,
      null,
      null,
      CHAIN_IADDRESS
    );

    const deepLink = response.toWalletDeeplinkUri();
    const qrCodeUrl = await QRCode.toDataURL(deepLink);

    // Send the request to VerusID login endpoint using axios
    console.log("Server URL:", SERVER_URL);
    const result = await axios.post(`${SERVER_URL}/verusidlogin`, { challengeId, deepLink });
    
    // The VerusID name and consent verification are handled here
    const username = result.data?.getidentity || 'Unknown';

    // Return the login data, including the username
    return { deepLink, qrCodeUrl, challengeId, username };
  } catch (error) {
    console.error('Error creating login consent request:', error);
    throw new Error(error.message);
  }
}
