package com.topdorama.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final int REQUEST_EXPORT_BACKUP = 1001;
    private static final int REQUEST_IMPORT_BACKUP = 1002;
    private static final int MAX_BACKUP_BYTES = 5 * 1024 * 1024;
    private WebView webView;
    private String pendingBackup;

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(false);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);

        webView.addJavascriptInterface(new AndroidBridge(), "TopDoramaAndroid");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String u = request.getUrl().toString();
                if (u.startsWith("file:///android_asset/")) return false;
                Intent i = new Intent(Intent.ACTION_VIEW, request.getUrl());
                try { startActivity(i); } catch (Exception ignored) {}
                return true;
            }
        });
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != RESULT_OK || data == null || data.getData() == null) {
            if (requestCode == REQUEST_EXPORT_BACKUP) pendingBackup = null;
            return;
        }
        Uri uri = data.getData();
        if (requestCode == REQUEST_EXPORT_BACKUP) writeBackup(uri);
        else if (requestCode == REQUEST_IMPORT_BACKUP) readBackup(uri);
    }

    private void writeBackup(Uri uri) {
        String backup = pendingBackup;
        pendingBackup = null;
        if (backup == null) return;
        try (OutputStream output = getContentResolver().openOutputStream(uri, "wt")) {
            if (output == null) throw new IllegalStateException("Destino indisponível");
            output.write(backup.getBytes(StandardCharsets.UTF_8));
            Toast.makeText(this, "Backup salvo com sucesso.", Toast.LENGTH_LONG).show();
        } catch (Exception error) {
            Toast.makeText(this, "Não foi possível salvar o backup.", Toast.LENGTH_LONG).show();
        }
    }

    private void readBackup(Uri uri) {
        try (InputStream input = getContentResolver().openInputStream(uri); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (input == null) throw new IllegalStateException("Arquivo indisponível");
            byte[] buffer = new byte[8192];
            int total = 0;
            int count;
            while ((count = input.read(buffer)) != -1) {
                total += count;
                if (total > MAX_BACKUP_BYTES) throw new IllegalArgumentException("Arquivo muito grande");
                output.write(buffer, 0, count);
            }
            String json = output.toString(StandardCharsets.UTF_8.name());
            if (webView != null) webView.evaluateJavascript("window.importBackupFromAndroid(" + JSONObject.quote(json) + ")", null);
        } catch (Exception error) {
            Toast.makeText(this, "Arquivo de backup inválido ou muito grande.", Toast.LENGTH_LONG).show();
        }
    }

    private boolean shareWithPackage(String text, String packageName) {
        Intent sendIntent = new Intent(Intent.ACTION_SEND);
        sendIntent.setType("text/plain");
        sendIntent.putExtra(Intent.EXTRA_TEXT, text);
        sendIntent.setPackage(packageName);
        try {
            startActivity(sendIntent);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("TopDoramaAndroid");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void share(String text) {
            runOnUiThread(() -> {
                Intent sendIntent = new Intent(Intent.ACTION_SEND);
                sendIntent.setType("text/plain");
                sendIntent.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(sendIntent, "Compartilhar Top Dorama"));
            });
        }

        @JavascriptInterface
        public void shareWhatsApp(String text) {
            runOnUiThread(() -> {
                if (shareWithPackage(text, "com.whatsapp") || shareWithPackage(text, "com.whatsapp.w4b")) return;
                try {
                    Intent browser = new Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/?text=" + Uri.encode(text)));
                    startActivity(browser);
                } catch (Exception ignored) {
                    share(text);
                }
            });
        }

        @JavascriptInterface
        public void exportBackup(String json, String fileName) {
            runOnUiThread(() -> {
                pendingBackup = json;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, fileName == null || fileName.trim().isEmpty() ? "top-dorama-backup.json" : fileName);
                try {
                    startActivityForResult(intent, REQUEST_EXPORT_BACKUP);
                } catch (Exception error) {
                    pendingBackup = null;
                    Toast.makeText(MainActivity.this, "Não foi possível abrir o local para salvar.", Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface
        public void importBackup() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/json", "text/plain"});
                try {
                    startActivityForResult(intent, REQUEST_IMPORT_BACKUP);
                } catch (Exception error) {
                    Toast.makeText(MainActivity.this, "Não foi possível abrir o seletor de arquivos.", Toast.LENGTH_LONG).show();
                }
            });
        }
    }
}
