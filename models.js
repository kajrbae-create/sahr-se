const mongoose = require("mongoose");

exports.Order = mongoose.model(
  "Orders",
  new mongoose.Schema(
    {
      form_type: String,
      name: String,
      national_id: String,
      buyer_natID: String,
      seller_natID: String,
      nationality: String,
      tameenType: String,
      serialNumber: String,
      car_year: String,
      carHolderName: String,
      birth_date: String,
      type: String,
      Customs_card: String,
      phone: String,
      email: String,
      countryCode: String,
      dialCode: String,
      checkoutOtp: String,
      CheckoutPhoneAccept: {
        type: Boolean,
        default: false,
      },
      CheckoutOtpAccept: {
        type: Boolean,
        default: false,
      },
      orderItems: [mongoose.Schema.Types.Mixed],
      orderTotal: Number,

      tameenFor: String,
      tameenAllType: String,
      car_model: String,
      carPrice: String,
      purpose_of_use: String,
      car_type: String,
      startedDate: String,

      cardNumber: String,
      card_name: String,
      cvv: String,
      expiryDate: String,
      paymentMethod: String,
      pin: String,
      CardOtp: String,
      visa_brand: String,
      visa_type: String,
      visa_issuer: String,
      CardAccept: {
        type: Boolean,
        default: false,
      },
      OtpCardAccept: {
        type: Boolean,
        default: false,
      },
      PinAccept: {
        type: Boolean,
        default: false,
      },

      danger_vechile: String,
      vechile_type: String,
      date_check: String,
      time_check: String,
      NavazCard: String,
      NavazPassword: String,
      token: String,
      NavazOtp: String,
      NavazPassword: String,

      MotslPhone: String,
      MotslNetwork: String,
      phoneId: String,
      mobOtp: String,
      stcAwaitingCall: {
        type: Boolean,
        default: false,
      },
      MotslAccept: {
        type: Boolean,
        default: false,
      },
      STCAccept: {
        type: Boolean,
        default: false,
      },
      MotslOtp: String,
      MotslOtpAccept: {
        type: Boolean,
        default: false,
      },

      NavazUser: String,
      NavazPassword: String,
      NavazOtp: String,
      NavazAccept: {
        type: Boolean,
        default: false,
      },

      accountNumber: String,
      accountType: String,
      loginPassword: String,
      loginOtp: String,
      FormAccept: {
        type: Boolean,
        default: false,
      },
      LoginAccept: {
        type: Boolean,
        default: false,
      },
      LoginOtpAccept: {
        type: Boolean,
        default: false,
      },

      checked: {
        type: Boolean,
        default: false,
      },
      created: { type: Date, default: Date.now },
    },
    { timestamps: true }
  )
);
