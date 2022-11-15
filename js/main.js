$(document).ready(() => {

    //SignalR Connection Builder # SignalR Bağlantı Yapılandırması
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:7276/chathub")
        .withAutomaticReconnect()
        .build();

    //SignalR Start Connection Function # SignalR Bağlantı Başlatma Metodu
    async function startConnection() {
        try {
            await connection.start();
            $("#enterNickname").removeAttr("disabled");
            $("#enterNickname").html("Join to InstaChat!");
        } catch (err) {
            console.log(err);
            setTimeout(startConnection, 5000);
        }
    };

    //SignalR When Connection Closed # SignalR Bağlantı Kapatıldığında
    connection.onclose(async () => {
        $("#enterChat").attr("disabled", "disabled");
        $("#sendMessage").attr("disabled", "disabled");
        $("#message").attr("disabled", "disabled");
        $("#enterNickname").attr("disabled", "disabled");
        await startConnection();
    });

    //SingalR on Reconnecting # SignalR Tekrar Bağlanırken
    connection.onreconnecting(() => {
        $("#enterChat").attr("disabled", "disabled");
        $("#sendMessage").attr("disabled", "disabled");
        $("#message").attr("disabled", "disabled");
        $("#enterNickname").attr("disabled", "disabled");
        $("#enterNickname").html("Connecting...");
    });

    //SignalR on Reconnected # SignalR Tekrar Bağlandığında
    connection.onreconnected(() => {
        location.reload();
    });

    // Start the Connection # Bağlantıyı Başlat
    startConnection();

    //Entered Nickname # Rumuz Girildiğinde
    $("#enterNickname").on("click", () => {
        const nickname = $.trim($("#nickname").val());
        if (nickname.length) {
            connection.invoke("ConnectUserWithNickName", nickname).catch(error => console.log(error));
            $("#enterChat").removeAttr("disabled");
            $("#sendMessage").removeAttr("disabled");
            $("#message").removeAttr("disabled");
            $("#enterNickname").attr("disabled", "disabled");
            $("#enterNickname").html("Joined.");
            $("#nickname").attr("disabled", "disabled");
            $("title").html(`InstaChat! - ${nickname}`);
        }
        else
            alert("Please enter a nickname.");
    });

    //User Joined Notification # Kullanıcı Katıldığında Bilgilendirme.
    connection.on("clientJoined", clientName => {
        $("#chatArea").append(`<div class="alert alert-success py-1 my-1" role="alert"> ### <b> ${clientName} </b> joined to chat. ### </div>`)
    });

    //User Left Notification # Kullanıcı Ayrıldığında Bilgilendirme.
    connection.on("clientLeft", clientName => {
        $("#chatArea").append(`<div class="alert alert-danger py-1 my-1" role="alert"> ### <b> ${clientName} </b> left from chat. ### </div> `)
    });

    //User List Update # Kullanıcı Listesi Güncellendiğinde
    connection.on("clientListUpdated", clientList => {
        $("#userList").empty();
        $.each(clientList, (_, val) => {
            $("#userList").append(`<a href="#" class="list-group-item list-group-item-action user-list-item"> ${val.nickName} </a>`);
        });
        scroolToEnd();
    });

    //Choice Receiver # Alıcıyı Seç
    $("body").on("click", ".user-list-item", function () {
        $(".user-list-item").each((index, item) => {
            item.classList.remove("active");
        });
        $(this).addClass(" active");
        $("#message").attr("placeholder", "Send message to: " + $(".user-list-item.active").first().html());
    });

    //Send Message # Mesaj Gönder.
    $("#sendMessage").on('click', () => {
        $("#sendMessage").attr("disabled", "disabled");
        $("#sendMessage").html("Please wait.");
        const clientName = $(".user-list-item.active").first().html();
        const message = $.trim($("#message").val());
        if (message.length && clientName != null) {
            $("#message").val("");
            connection.invoke("sendMessageAsync", message, clientName);
            $("#chatArea").append(`<div class="card my-1"><div class="card-body p-2 align-self-end"><h6 class="card-title m-0 text-end">to <b>${clientName}</b> from <b>You</b> </h6><p class="card-text text-end"> ${message} </p></div></div>`);
            scroolToEnd();
        }
        else if (!message.length)
            alert("Please enter a message. Your message can not be empty, null or whitespace");
        else
            alert("Please select a receiver!")

        setTimeout(() => {
            $("#sendMessage").removeAttr("disabled");
            $("#sendMessage").html("Send!");
        }, 2000);
    })

    //Nickname taken # Nickname kayıtlı ise
    connection.on("thisNicknameRegistered", () => {
        $("title").html("InstaChat!");
        $("#nickname").val("");
        $("#nickname").removeAttr("disabled");
        $("#enterNickname").removeAttr("disabled");
        $("#sendMessage").attr("disabled", "disabled");
        $("#message").attr("disabled", "disabled");
        $("#enterChat").attr("disabled", "disabled");
        alert("This nickname is taken. Try different nickname.");
    });

    //Already registered client # Daha önceden kaydedilmiş kullanıcı.
    connection.on("registeredClient", nickname => {
        $("title").html(`InstaChat! - ${nickname}`);
        $("#nickname").val(nickname);
        alert(`You already registered. Your nickname: ${nickname}`);
    });

    //Receive Message # Mesaj Alma
    connection.on("receiveMessage", (message, caller) => {
        $("#chatArea").append(`<div class="card p-0 my-1 message-container"><div class="card-body p-2 align-self-start"><h6 class="card-title m-0">${caller}</h6><p class="card-text">${message}</p></div></div>`);
        scroolToEnd();
    });

    //Chat Area Scroll To End.
    function scroolToEnd() {
        $("#chatArea").scrollTop($("#chatArea").prop("scrollHeight"));
    }
});