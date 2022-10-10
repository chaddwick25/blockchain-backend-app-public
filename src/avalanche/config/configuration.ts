export default async() => ({
  avalanche: {
    ip: process.env.HOST,
    port: Number(process.env.AVAX_API_PORT),
    protocol: process.env.PROTOCOL,
    networkID: Number(process.env.NETWORK_ID),
    cHexAddress: String(process.env.HEX_ADDRESS)
  },
});
