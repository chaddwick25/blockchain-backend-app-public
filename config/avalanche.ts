
import { Defaults } from 'avalanche/dist/utils';
const NETWORK_ID = Number(process.env.NETWORK_ID)

export default () => ({
    apiConfig: {
        protocol: process.env.PROTOCOL,
        host: process.env.HOST,
        port: Number(process.env.AVAX_API_PORT),
        networkID: NETWORK_ID,
        avax_username: process.env.AVAX_USER,
        avax_user_password: process.env.AVAX_USER_PASSWORD,
        //TODO: Investigate Jest Error TypeError: Cannot read properties of undefined (reading 'X')
        //  xChainBlockchainId: Defaults.network[NETWORK_ID].X.blockchainID
        xChainBlockchainId: String(Defaults.network[NETWORK_ID].X.blockchainID),
        cChainBlockchainId:  String(Defaults.network[NETWORK_ID].C.blockchainID),
        avaxAssetID: Defaults.network[NETWORK_ID].X.avaxAssetID 
    }
});