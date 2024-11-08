// verusIdLogin.js
import { VerusIdInterface, primitives } from 'verusid-ts-client';
import QRCode from 'qrcode';
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
  
    console.log('Generated Challenge ID:', challengeId);
    try {
      const decoded = primitives.fromBase58Check(challengeId); // Manually decode to check for checksum errors
      console.log('Decoded Challenge ID:', decoded);
    } catch (err) {
      console.error('Checksum or decoding error:', err);
    }
  
    return challengeId;
  }
  
  

  export async function generateLogin() {
  const challengeId = generateChallengeID();
  
  try {
    const response = await verusId.createLoginConsentRequest(
      SIGNING_IADDRESS,
      new primitives.LoginConsentChallenge({
        challenge_id: challengeId,
        requested_access: [
          new primitives.RequestedPermission(primitives.IDENTITY_VIEW.vdxfid)
        ],
        redirect_uris: [
          new primitives.RedirectUri(`${SERVER_URL}`, primitives.LOGIN_CONSENT_WEBHOOK_VDXF_KEY.vdxfid)
        ],
        created_at: Math.floor(Date.now() / 1000),
      }),
      PRIVATE_KEY,
      null,
      null,
      CHAIN_IADDRESS
    );

    const deepLink = response.toWalletDeeplinkUri();
    const qrCodeUrl = await QRCode.toDataURL(deepLink);
    
    // Verify consent to retrieve the VerusID name
    const verificationResult = await verusId.verifyLoginConsentRequest(
      primitives.LoginConsentRequest.fromWalletDeeplinkUri(deepLink),
      null,
      CHAIN_IADDRESS
    );

    const username = verificationResult.result?.friendlyname;  // Extract the VerusID name

    console.log('VerusID Name:', username);

    return { deepLink, qrCodeUrl, challengeId, username };  // Return username

  } catch (error) {
    console.error('Error creating login consent request:', error);
    throw new Error(error.message);
  }
}

