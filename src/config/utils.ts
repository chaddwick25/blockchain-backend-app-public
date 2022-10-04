
export default () => ({
    apiConfig: {
        protocol: process.env.PROTOCOL,
        host: process.env.HOST,
        port: Number(process.env.AVAX_API_PORT),
        networkID: Number(process.env.NETWORK_ID),
        avax_username: process.env.AVAX_USER,
        avax_user_password: process.env.AVAX_USER_PASSWORD,
    }
});