declare module 'vietqr' {
  export class VietQR {
    constructor({
      clientID = '',
      apiKey = '',

    }) {
      this.clientID = clientID;
      this.apiKey = apiKey;
      this.message = 'Please check your API key and client key';
      this.apiUrl = 'https://api.vietqr.io';
    }

    async getBanks() {
        if (this.checkKey()) {
            return await getData(`${this.apiUrl}/v2/banks`);
        }
        this.sendMessage(this.checkKey());
    }

    genQuickLink({
        bank = '',
        accountName = '',
        accountNumber = '',
        amount = '',
        memo = '',
        template = 'qr_only',
        media = ''
    }) {
        if (this.checkKey()) {
            let url = media == '.jpg' ?
                encodeURI(`${this.apiUrl}/${bank}/${accountNumber}/${amount}/${(memo)}/${template}.jpg?accountName=${accountName}`).replace(/%20/g, "+")
                :
                encodeURI(`${this.apiUrl}/${bank}/${accountNumber}/${amount}/${memo}/${template}.png?accountName=${accountName}`).replace(/%20/g, "+");
            return url
        }
        this.sendMessage(this.checkKey());
    }
  }
}