FROM jess/chromium

USER root

RUN apt-get update && \
    apt-get install -y curl bash wget ca-certificates && \
    rm -rf /var/lib/apt/lists/*

CMD ["chromium-browser", "--no-sandbox", "--headless", "--disable-gpu", "--remote-debugging-address=0.0.0.0", "--remote-debugging-port=9222"]
