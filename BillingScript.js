// Assuming you have already included the Razorpay SDK script in your HTML

// Define a function to handle the payment process
function initiatePayment() {
    var options = {
        // Your Razorpay options/configuration here
        key: 'YOUR_RAZORPAY_KEY_ID',
        amount: 50000, // Example: Amount in paise (50000 paise = ₹500)
        currency: 'INR',
        name: 'Your Company Name',
        description: 'Purchase Description',
        image: 'your_logo_url',
        order_id: 'order_id_from_backend', // This should be generated on your backend
        handler: function(response) {
            alert('Payment successful');
            console.log(response);
            // Handle payment success, update UI or redirect to a success page
        },
        prefill: {
            name: 'Customer Name',
            email: 'customer@example.com',
            contact: '9999999999'
        },
        notes: {
            address: 'Customer Address'
        }
    };

    var rzp = new Razorpay(options);
    rzp.open();
}

// Add event listener to the "Pay Now" button
var payNowButton = document.getElementById('payNowButton');
if (payNowButton) {
    payNowButton.addEventListener('click', function() {
        initiatePayment();
    });
}

