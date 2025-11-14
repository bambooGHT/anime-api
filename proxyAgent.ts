import { SocksProxyAgent } from 'socks-proxy-agent';

export const proxyAgent = new SocksProxyAgent(process.env.GLOBAL_AGENT_HTTP_PROXY.replace("http", "socks5"));
