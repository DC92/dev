<?php
header("Content-Type: text/html");  
?><!DOCTYPE html>
<html lang="en">
  <head>
    <!-- "Usual" title charset description viewport -->
    <title>Barebones PWA</title>
    <meta charset="utf-8" />
    <meta name="description" content="A barebones PWA page" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.5" />

    <!-- Icons & platform specific -->
    <!-- Good old favicon -->
    <link rel="icon" href="favicon.png" type="image/png" />

    <!-- Android / Chrome -->
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="white" />

    <!-- IOS app icon + mobile Safari -->
    <link rel="apple-touch-icon" href="icon-512.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <meta name="apple-mobile-web-app-title" content="Hello World" />

    <!-- WINDOWS -->
    <meta name="msapplication-TileImage" content="icon-512.png" />
    <meta name="msapplication-TileColor" content="#ffffff" />

    <!-- WEB APP manifest -->
    <!-- https://web.dev/add-manifest/ -->
    <link rel="manifest" href="manifest.json" />

    <!-- Service worker -->
    <script>
		if ("serviceWorker" in navigator)
			navigator.serviceWorker.register("service-worker.js.php"); 
    </script>

    <!-- App stylesheet + javascript -->
	<link href="../dist/myol.css" rel="stylesheet">
	<script src="../dist/myol.js"></script>
	<script src="../examples/ressources/trace.js"></script>
  </head>
  <body class="select-ext">
    It Works!
  </body>
</html>