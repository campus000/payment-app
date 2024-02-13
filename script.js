'use strict';
document.addEventListener('WebComponentsReady', function () {
  let progress = document.querySelector('#progress');
  let dialog = document.querySelector('#dialog');
  let message = document.querySelector('#message');
  let printButton = document.querySelector('#print');
  let printCharacteristic;
  let index = 0;
  let data;
  progress.hidden = true;

  let image = document.querySelector('#image');
  // Use the canvas to get image data
  let canvas = document.createElement('canvas');
  // Canvas dimensions need to be a multiple of 40 for this printer
  canvas.width = 120;
  canvas.height = 120;
  let context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;

  function getDarkPixel(x, y) {
    // Return the pixels that will be printed black
    let red = imageData[((canvas.width * y) + x) * 4];
    let green = imageData[((canvas.width * y) + x) * 4 + 1];
    let blue = imageData[((canvas.width * y) + x) * 4 + 2];
    return (red + green + blue) > 0 ? 1 : 0;
  }

  function getImagePrintData() {
    if (imageData == null) {
      console.log('No image to print!');
      return new Uint8Array([]);
    }
    // Each 8 pixels in a row is represented by a byte
    let printData = new Uint8Array(canvas.width / 8 * canvas.height + 8);
    let offset = 0;
    // Set the header bytes for printing the image
    printData[0] = 29;  // Print raster bitmap
    printData[1] = 118; // Print raster bitmap
    printData[2] = 48; // Print raster bitmap
    printData[3] = 0;  // Normal 203.2 DPI
    printData[4] = canvas.width / 8; // Number of horizontal data bits (LSB)
    printData[5] = 0; // Number of horizontal data bits (MSB)
    printData[6] = canvas.height % 256; // Number of vertical data bits (LSB)
    printData[7] = canvas.height / 256;  // Number of vertical data bits (MSB)
    offset = 7;
    // Loop through image rows in bytes
    for (let i = 0; i < canvas.height; ++i) {
      for (let k = 0; k < canvas.width / 8; ++k) {
        let k8 = k * 8;
        //  Pixel to bit position mapping
        printData[++offset] = getDarkPixel(k8 + 0, i) * 128 + getDarkPixel(k8 + 1, i) * 64 +
          getDarkPixel(k8 + 2, i) * 32 + getDarkPixel(k8 + 3, i) * 16 +
          getDarkPixel(k8 + 4, i) * 8 + getDarkPixel(k8 + 5, i) * 4 +
          getDarkPixel(k8 + 6, i) * 2 + getDarkPixel(k8 + 7, i);
      }
    }
    return printData;
  }

  function handleError(error) {
    alert(error);
    progress.hidden = true;
    printCharacteristic = null;
    dialog.open();
  }

  function sendNextImageDataBatch(resolve, reject) {
    // Can only write 512 bytes at a time to the characteristic
    // Need to send the image data in 512 byte batches
    if (index + 512 < data.length) {
      printCharacteristic.writeValue(data.slice(index, index + 512)).then(() => {
        index += 512;
        sendNextImageDataBatch(resolve, reject);
      })
        .catch(error => reject(error));
    } else {
      // Send the last bytes
      if (index < data.length) {
        printCharacteristic.writeValue(data.slice(index, data.length)).then(() => {
          resolve();
        })
          .catch(error => reject(error));
      } else {
        resolve();
      }
    }
  }
  /*
  function sendTextData() {
    // Get the bytes for the text
    let encoder = new TextEncoder("utf-8");
    // Add line feed + carriage return chars to text
    let text = encoder.encode(message.value + '\u000A\u000D');
    return printCharacteristic.writeValue(text).then(() => {
      console.log('Write done.');
    });
  }

  function sendPrinterData() {
         const receiptContent = generateReceiptContent(); // Generate the receipt content
    alert(receiptContent);
    sendTextData()
      .then(() => {
        progress.hidden = true;
      })
      .catch(handleError);
  }*/


  
    function sendTextData(text) {
      let encoder = new TextEncoder("utf-8");
      // Add line feed + carriage return chars to text
      let encodedText = encoder.encode(text+ '\u000A\u000D');
      return printCharacteristic.writeValue(encodedText).then(() => {
          console.log('Write done.');
      });
  }
  
  // Use this function to initiate the printing process
/*  function printReceipt() {
      const receiptContent = generateReceiptContent(); // Generate the receipt content
    alert(receiptContent);
    sendTextData(receiptContent)
    .then(() => {
      progress.hidden = true;
    })
    .catch(handleError);
}
 */

  // Use this function to initiate the printing process
function printReceipt() {
    const receiptContent = generateReceiptContent(); // Generate the receipt content

    // Check if the receipt content size exceeds 512 bytes
    if (receiptContent.length > 512) {
        const firstPart = receiptContent.substring(0, 512);
        const secondPart = receiptContent.substring(512);

        // Print the first part
        sendTextData(firstPart)
            .then(() => {
                // After printing the first part, print the second part
                sendTextData(secondPart)
                    .then(() => {
                        progress.hidden = true;
                    })
                    .catch(handleError);
            })
            .catch(handleError);
    } else {
        // If the content size is within 512 bytes, print it directly
        sendTextData(receiptContent)
            .then(() => {
                progress.hidden = true;
            })
            .catch(handleError);
    }
}

  function sendPrinterData() {
    sendTextData()
      .then(() => {
        progress.hidden = true;
      })
      .catch(handleError);
  }

  printButton.addEventListener('click', function () {
    progress.hidden = false;
    if (printCharacteristic == null) {
      navigator.bluetooth.requestDevice({
        filters: [{
          services: ['000018f0-0000-1000-8000-00805f9b34fb']
        }]
      })
        .then(device => {
          console.log('> Found ' + device.name);
          console.log('Connecting to GATT Server...');
          return device.gatt.connect();
        })
        .then(server => server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb"))
        .then(service => service.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb"))
        .then(characteristic => {
          // Cache the characteristic
          printCharacteristic = characteristic;
           printReceipt();
         // sendPrinterData();

        })
        .catch(handleError);
    } else {
           printReceipt();
    }
  });
});// Object to store added items and their quantities
const addedItems = {};

async function createButtonsFromCSV() {
  try {
    const response = await fetch('menu.csv');
    const csvData = await response.text();

    // Parse CSV data
    const rows = csvData.split('\n');
    const headers = rows[0].split(',');

    // Extract item data from CSV
    const items = rows
      .filter(row => row.trim() !== '') // Filter out empty lines
      .slice(1)
      .map(row => {
        const values = row.split(',');
        const item = {};

        headers.forEach((header, index) => {
          const trimmedHeader = header.trim();
          const trimmedValue = values[index] !== undefined ? values[index].trim() : '';

          if (trimmedValue !== '') {
            item[trimmedHeader] = trimmedValue;
          } else {
            console.error(`Value for header '${trimmedHeader}' is missing in row: ${row}`);
          }
        });

        console.log('Parsed item:', item); // Add this line for debugging

        return item;
      });

    console.log('All items:', items); // Add this line for debugging

    // Create buttons
    createButtons(items);
  } catch (error) {
    console.error('Error reading CSV file:', error);
  }
}


// Function to create clickable buttons
function createButtons(data) {
  var buttonContainer = document.getElementById('button-container');

  data.forEach(function (item, index) {
    var button = document.createElement('button');
    button.innerHTML = `${item.Item} - Rs${item.Price}`;
    button.className = 'button';
    button.id = `button-${index + 1}`;
    button.addEventListener('click', function () {
      addItem(item.Item, item.Price);
    });

    buttonContainer.appendChild(button);
  });
}

// Function to add item to the "Added Items" partition
function addItem(item, price) {
  const addedItemsContainer = document.getElementById('added-items');

  // Check if the item is already added
  if (addedItems[item]) {
    // Increment quantity if the item is already in the list
    addedItems[item].quantity += 1;
  } else {
    // Add the item to the list with quantity 1
    addedItems[item] = { price: price, quantity: 1 };
  }

  // Update the display and summary
  updateAddedItemDisplay();
  updateSummary();
}

// Function to display added item in the "Added Items" partition
function displayAddedItem(item, price, quantity) {
  const addedItemsContainer = document.getElementById('added-items');
  const newItemContainer = document.createElement('div');
  newItemContainer.className = 'added-item';

  const itemInfoContainer = document.createElement('div');
  itemInfoContainer.className = 'item-info';

  const itemName = document.createElement('span');
  itemName.className = 'item-name';
  itemName.textContent = item;

  const itemPrice = document.createElement('span');
  itemPrice.className = 'item-price';
  itemPrice.textContent = `Rs${price * quantity}`;
//  itemPrice.style.marginLeft = '10px'; // Adjust the value as needed

  //itemPrice.style.marginRight = '100px'; // Adjust the value as needed


  const quantityButtons = document.createElement('div');
  quantityButtons.className = 'quantity-buttons';
  const minusButton = document.createElement('span');
  //minusButton.style.marginleft = '50px';
  //minusButton.style.marginRight = '50px';

  minusButton.className = 'quantity-button';
  minusButton.innerHTML = '-';
  minusButton.addEventListener('click', function () {
    if (addedItems[item].quantity > 1) {
      addedItems[item].quantity -= 1;
      updateAddedItemDisplay();
      updateSummary();
    } else {
      // If quantity is 0, remove the item
      delete addedItems[item];
      updateAddedItemDisplay();
      updateSummary();
    }
  });



  const quantityDisplay = document.createElement('span');
  quantityDisplay.className = 'quantity';
  quantityDisplay.textContent = quantity;

  const plusButton = document.createElement('span');
  plusButton.style.marginRight = '50px';

  plusButton.className = 'quantity-button';
  plusButton.innerHTML = '+';
  plusButton.addEventListener('click', function () {
    addedItems[item].quantity += 1;
    updateAddedItemDisplay();
    updateSummary();
  });

  itemInfoContainer.appendChild(itemName);
  itemInfoContainer.appendChild(document.createTextNode(' ')); // Add a space12
  itemInfoContainer.appendChild(itemPrice);

  quantityButtons.appendChild(plusButton);
  quantityButtons.appendChild(quantityDisplay);
  quantityButtons.appendChild(minusButton);

  newItemContainer.appendChild(itemInfoContainer);
  newItemContainer.appendChild(quantityButtons);

  addedItemsContainer.appendChild(newItemContainer);
}
// Function to update the display of added item quantity
function updateAddedItemDisplay() {
  const addedItemsContainer = document.getElementById('added-items');
  addedItemsContainer.innerHTML = '<h2>Added Items:</h2>';

  // Iterate through added items and display them
  for (const item in addedItems) {
    displayAddedItem(item, addedItems[item].price, addedItems[item].quantity);
  }
}

// Function to update the summary
function updateSummary() {
  const summaryDiv = document.getElementById('summary');
  const priceSpan = document.getElementById('price');
  const taxSpan = document.getElementById('tax');
  const totalSpan = document.getElementById('total');

  // Calculate the total price, tax, and overall total
  let totalPrice = 0;

  for (const item in addedItems) {
    totalPrice += addedItems[item].price * addedItems[item].quantity;
  }

  const tax = totalPrice * 0.05; // Assuming tax is 18%
  const total = totalPrice + tax;

  // Update the summary display
  priceSpan.textContent = totalPrice.toFixed(2);
  taxSpan.textContent = tax.toFixed(2);
  totalSpan.textContent = total.toFixed(2);
}


function generateReceiptContent() {
  const currentDate = new Date();
const formattedDate = currentDate.toDateString();
const formattedTime = currentDate.toLocaleTimeString();

  let content = '';

  // Header with Rectangle around "Campus savories" and spaces added
  content += '--------------------------------\n';

  content += '        Campus savories         \n';     
  content += '--------------------------------\n';

content += 'GST No-29ABEPS2937F1ZF\n';
content += 'Bill No.: #12345\n';
content += `Time.:  ${formattedTime}\n`;
  content += '--------------------------------\n';

content += '          INVOICE \n';
content += '--------------------------------\n';

content += 'Item        Quantity      Amount\n';

let totalAmount = 0;
 

// Loop through added items and display them in the table
for (const item in addedItems) {
const itemName = item.toString(); // Use the item itself as the name
const itemCost = addedItems[item].price * addedItems[item].quantity;

// Item Row with adjusted spacing and line break for long item names
const itemRow = `${itemName}${addedItems[item].quantity.toString()}${itemCost.toFixed(2)}\n`;
content += itemRow;

// If the item name is too long, add the remaining part on the next line
/*if (itemName.length > 10) {
  content += `${itemName.slice(10)}\n`;
}
*/
totalAmount += itemCost;
}

content += '--------------------------------\n';
content += `Total Amount:        Rs ${totalAmount.toFixed(2)}\n`;
// Calculate 5% tax (GST) on the total amount
const tax = totalAmount * 0.05;

// Calculate the grand total by adding the tax to the total amount
const grandTotal = totalAmount + tax;

content += `GST (5%):             Rs  ${tax.toFixed(2)}\n`;
const roundedGrandTotal = grandTotal % 1 === 0 ? grandTotal : Math.ceil(grandTotal);

// Calculate the round-off amount (always positive)
const roundOff = roundedGrandTotal - grandTotal;
// Calculate the round off amount


content += `Round Up:             Rs  ${roundOff.toFixed(2)}\n`;

// Add the rounded grand total
content += `Grand Total:          Rs ${Math.round(roundedGrandTotal).toFixed(2)}\n`;
content += '--------------------------------\n';

  return content;
}
 

// Call the function to create buttons from CSV
createButtonsFromCSV();
