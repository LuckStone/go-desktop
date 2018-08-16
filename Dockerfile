FROM busybox

EXPOSE 80

CMD export PATH=$PATH:/root

COPY ./conf /root/conf
COPY ./static /root/static
COPY ./views /root/views

COPY ./go-desktop /root
CMD chmod +x /root/go-desktop

RUN mkdir -p /root/logs


WORKDIR /root
CMD ["./go-desktop"]
