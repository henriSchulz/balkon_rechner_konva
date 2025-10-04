import axios from "axios";







export const PRODUCT_ID = "8572";


// LENGTHS = [
    // 820, 1000, 1200, 1250, 1370, 1500, 1660, 1710, 2000, 2280, 2510, 3010, 3430, 4050, 5050, 6050, 6900
// ];

export const PRODUCTS = {
    S: [
        {length: 820,id: 8572,},
        {length: 1000, id: 8573,},
        {length: 1200, id : 8574,},
        {length: 1250, id : 8575,},
        {length: 1370, id : 8576,},
        {length: 1500, id : 8577,},
        {length: 1660, id : 8578,},
        {length: 1710, id : 8579,},
        {length: 2000, id : 8580,},
        {length: 2280, id : 8581,},
        {length: 2510, id : 8582,},
        {length: 3010, id : 8583,},
        {length: 3430, id : 8584,},
        {length: 4050, id : 8585,},
        {length: 5050, id : 8586,},
        {length: 6050, id : 8587,},
        {length: 6900, id : 8588,},
    ],
    

}


export async function addToCart(productId = PRODUCT_ID, quantity = 1) {
    try {
      const params = window.wc_add_to_cart_params;
      if (!params) {
        const error = 'WooCommerce JS Parameter nicht gefunden';
        console.error(error);
        throw new Error(error);
      }

      const url = params.wc_ajax_url.replace('%%endpoint%%', 'add_to_cart');

      const formData = new FormData();
      formData.append('product_id', productId); // Verwende die übergebene productId
      formData.append('quantity', quantity); // Verwende die übergebene quantity

      // 1️⃣ Produkt hinzufügen
      const response = await axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      // 2️⃣ Mini-Cart aktualisieren
    //   const refreshUrl = params.wc_ajax_url.replace('%%endpoint%%', 'get_refreshed_fragments');
    //   await axios.post(refreshUrl, null, {
    //     withCredentials: true,
    //   });

      console.log(`✅ Artikel (ID: ${productId}, Menge: ${quantity}) hinzugefügt & Header aktualisiert`);
      return { success: true, productId, quantity, response: response.data };
    } catch (error) {
      console.error('Fehler beim Hinzufügen:', error);
      throw error; // Fehler weiterwerfen, damit er im aufrufenden Code behandelt werden kann
    }
}
