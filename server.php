<?php
header('Content-Type: application/json');

// Check if the request is a POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get the raw POST data
    $postData = file_get_contents('php://input');
    
    // Decode the JSON data
    $requestData = json_decode($postData, true);
    
    // Check if 'printData' key is present in the decoded JSON
    if (isset($requestData['printData'])) {
        // Get the receipt content from the request data
        $receiptContent = $requestData['printData'];

        // Print to /dev/usb/lp0
        $printerDevice = '/dev/usb/lp0';

        // Write content to the printer device file
        if (file_put_contents($printerDevice, $receiptContent) !== false) {
            // Send success response to the client
            echo json_encode(['success' => true]);
        } else {
            // Send error response to the client
            echo json_encode(['success' => false, 'error' => 'Error writing to printer device']);
        }
    } else {
        // Send error response to the client
        echo json_encode(['success' => false, 'error' => 'Invalid request data']);
    }
} else {
    // Send error response for unsupported request method
    echo json_encode(['success' => false, 'error' => 'Unsupported request method']);
}
?>

