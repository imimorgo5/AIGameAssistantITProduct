package ru.project.gameAssistantBackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import reactor.netty.transport.ProxyProvider;

@Configuration
public class WebConfig {
    @Value("${proxy.host}")
    private String host;

    @Value("${proxy.port:1080}")
    private int port;

    @Value("${proxy.login}")
    private String login;

    @Value("${proxy.password}")
    private String password;

    @Bean("openRouterWebClient")
    public WebClient openRouterWebClient() {
        HttpClient httpClient = HttpClient.create();
        if (!host.isBlank()) {
            httpClient = httpClient.proxy(proxy -> {
                var address = proxy.type(ProxyProvider.Proxy.SOCKS5).host(host).port(port);
                if (!login.isBlank()) {
                    address.username(login).password(p -> password);
                }
            });
        }

        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .codecs(codecs -> codecs.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
                .build();
    }

}
