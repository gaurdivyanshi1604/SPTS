import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * SPTS Backend - Java HTTP REST Server (Backend.java)
 * Student Performance Tracker System v1.0
 * 
 * Complies with SRS specifications:
 * - Built using Java standard library (com.sun.net.httpserver)
 * - Zero third-party build dependencies required
 * - Handles static file serving (HTML, JS, CSS, JSON)
 * - Exposes REST endpoints to read and persist records in data.json:
 * GET /api/data -> Returns full database JSON
 * POST /api/save -> Persists modified JSON data directly to data.json
 * POST /api/login -> Validates role-specific authentication
 * POST /api/change-pass -> Updates credentials securely
 */
public class Backend {

    private static final int PORT = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
    private static final String DATA_FILE = "data.json";

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        System.out.println("==================================================");
        System.out.println("   SPTS Java Backend Server (Version 1.0)");
        System.out.println("   Compliant with SRS Java Backend Specification");
        System.out.println("==================================================");

        // API Contexts
        server.createContext("/api/data", new ApiDataHandler());
        server.createContext("/api/save", new ApiSaveHandler());
        server.createContext("/api/login", new ApiLoginHandler());
        server.createContext("/api/change-pass", new ApiChangePasswordHandler());

        // Static Web Files Context (serves index.html, app.js, data.json)
        server.createContext("/", new StaticFileHandler());

        server.setExecutor(null); // default multithreaded executor
        server.start();

        System.out.println(">>> Server successfully started at http://localhost:" + PORT + "/");
        System.out.println(">>> Press Ctrl+C in terminal/console to stop the server.");
    }

    // =========================================================================
    // Handlers
    // =========================================================================

    /**
     * Serves current data.json contents
     */
    static class ApiDataHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                File file = new File(DATA_FILE);
                if (!file.exists()) {
                    sendJsonResponse(exchange, 404, "{\"error\": \"data.json file not found\"}");
                    return;
                }
                byte[] bytes = Files.readAllBytes(file.toPath());
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                exchange.sendResponseHeaders(200, bytes.length);
                OutputStream os = exchange.getResponseBody();
                os.write(bytes);
                os.close();
            } else {
                sendJsonResponse(exchange, 405, "{\"error\": \"Method Not Allowed\"}");
            }
        }
    }

    /**
     * Receives full updated JSON payload and persists it to data.json
     */
    static class ApiSaveHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                String body = readRequestBody(exchange);
                if (body == null || body.trim().isEmpty()) {
                    sendJsonResponse(exchange, 400, "{\"success\": false, \"message\": \"Payload is empty\"}");
                    return;
                }

                // Write atomically/safely to data.json
                synchronized (Backend.class) {
                    Files.write(Paths.get(DATA_FILE), body.getBytes(StandardCharsets.UTF_8));
                }

                sendJsonResponse(exchange, 200,
                        "{\"success\": true, \"message\": \"Data successfully saved to data.json on disk!\"}");
            } else {
                sendJsonResponse(exchange, 405, "{\"error\": \"Method Not Allowed\"}");
            }
        }
    }

    /**
     * Validates credentials against data.json on server-side
     */
    static class ApiLoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                String body = readRequestBody(exchange);
                String userId = extractJsonField(body, "userId");
                String password = extractJsonField(body, "password");
                String role = extractJsonField(body, "role");

                File file = new File(DATA_FILE);
                if (!file.exists()) {
                    sendJsonResponse(exchange, 500, "{\"success\": false, \"message\": \"Database file missing\"}");
                    return;
                }

                String currentData = new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8);

                // Simple JSON inspect
                String userBlockSearch = "\"" + userId + "\"";
                int userIndex = currentData.indexOf(userBlockSearch);
                if (userIndex == -1) {
                    sendJsonResponse(exchange, 401, "{\"success\": false, \"message\": \"User ID not found.\"}");
                    return;
                }

                int blockEnd = currentData.indexOf("}", userIndex);
                if (blockEnd == -1)
                    blockEnd = currentData.length();
                String userBlock = currentData.substring(userIndex, blockEnd);

                String realPass = extractJsonField(userBlock, "password");
                String realRole = extractJsonField(userBlock, "role");

                if (!password.equals(realPass)) {
                    sendJsonResponse(exchange, 401, "{\"success\": false, \"message\": \"Invalid password.\"}");
                    return;
                }

                if (!role.equalsIgnoreCase(realRole)) {
                    sendJsonResponse(exchange, 403,
                            "{\"success\": false, \"message\": \"This ID is registered as " + realRole + " only.\"}");
                    return;
                }

                sendJsonResponse(exchange, 200,
                        "{\"success\": true, \"message\": \"Login authorized by Java backend.\"}");
            } else {
                sendJsonResponse(exchange, 405, "{\"error\": \"Method Not Allowed\"}");
            }
        }
    }

    /**
     * Password change handler
     */
    static class ApiChangePasswordHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                String body = readRequestBody(exchange);
                String userId = extractJsonField(body, "userId");
                String oldPass = extractJsonField(body, "oldPassword");
                String newPass = extractJsonField(body, "newPassword");

                if (newPass.length() < 6) {
                    sendJsonResponse(exchange, 400,
                            "{\"success\": false, \"message\": \"Password must be at least 6 characters.\"}");
                    return;
                }

                synchronized (Backend.class) {
                    File file = new File(DATA_FILE);
                    String data = new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8);

                    int uIdx = data.indexOf("\"" + userId + "\"");
                    if (uIdx == -1) {
                        sendJsonResponse(exchange, 404, "{\"success\": false, \"message\": \"User not found.\"}");
                        return;
                    }

                    int bEnd = data.indexOf("}", uIdx);
                    String block = data.substring(uIdx, bEnd);
                    String stored = extractJsonField(block, "password");

                    if (!stored.equals(oldPass)) {
                        sendJsonResponse(exchange, 400,
                                "{\"success\": false, \"message\": \"Current password incorrect.\"}");
                        return;
                    }

                    String updatedBlock = block.replaceFirst("\"password\":\\s*\"" + stored + "\"",
                            "\"password\": \"" + newPass + "\"");
                    String newData = data.substring(0, uIdx) + updatedBlock + data.substring(bEnd);
                    Files.write(file.toPath(), newData.getBytes(StandardCharsets.UTF_8));
                }

                sendJsonResponse(exchange, 200,
                        "{\"success\": true, \"message\": \"Password updated successfully in Java backend!\"}");
            } else {
                sendJsonResponse(exchange, 405, "{\"error\": \"Method Not Allowed\"}");
            }
        }
    }

    /**
     * Static file delivery handler (Serves HTML, CSS, JS, JSON)
     */
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path == null || path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }

            File file = new File("." + path);
            if (!file.exists() || file.isDirectory()) {
                String notFound = "<h1>404 Not Found</h1><p>File not found on SPTS Server</p>";
                exchange.sendResponseHeaders(404, notFound.length());
                OutputStream os = exchange.getResponseBody();
                os.write(notFound.getBytes());
                os.close();
                return;
            }

            String contentType = "text/plain";
            if (path.endsWith(".html"))
                contentType = "text/html; charset=UTF-8";
            else if (path.endsWith(".js"))
                contentType = "application/javascript; charset=UTF-8";
            else if (path.endsWith(".css"))
                contentType = "text/css; charset=UTF-8";
            else if (path.endsWith(".json"))
                contentType = "application/json; charset=UTF-8";

            exchange.getResponseHeaders().set("Content-Type", contentType);
            addCorsHeaders(exchange);

            byte[] bytes = Files.readAllBytes(file.toPath());
            exchange.sendResponseHeaders(200, bytes.length);
            OutputStream os = exchange.getResponseBody();
            os.write(bytes);
            os.close();
        }
    }

    // =========================================================================
    // Utility Helpers
    // =========================================================================

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line).append("\n");
        }
        return sb.toString().trim();
    }

    private static void sendJsonResponse(HttpExchange exchange, int statusCode, String json) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private static String extractJsonField(String json, String field) {
        String pattern = "\"" + field + "\"\\s*:\\s*\"([^\"]*)\"";
        java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
        java.util.regex.Matcher m = p.matcher(json);
        if (m.find()) {
            return m.group(1);
        }
        return "";
    }
}
