package org.example;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import com.fastcgi.FCGIInterface;


public class FastCGIServer {

    private static final ArrayList<String> history = new ArrayList<>();

    public static void main(String[] args) {
        FCGIInterface fcgi = new FCGIInterface();
        while (fcgi.FCGIaccept() >= 0) {
            try {
                if (FCGIInterface.request == null) {
                    continue;
                }

                Properties params = FCGIInterface.request.params;

                String requestMethod = params.getProperty("REQUEST_METHOD");
                String queryString = params.getProperty("QUERY_STRING");

                String responseBody = handleRequest(requestMethod, queryString);

                System.out.print("Content-type: application/json\r\n\r\n");
                System.out.print(responseBody);
                System.out.flush();

            } catch (Exception e) {
                e.printStackTrace();

                System.out.print("Content-type: application/json\r\n\r\n");
                System.out.print("{\"error\": \"Server error\"}");
                System.out.flush();
            }
        }
    }

    private static String handleRequest(String method, String queryString) {
        try {
            Map<String, String> queryParams = parseQueryString(queryString);


            if (!queryParams.containsKey("x") || !queryParams.containsKey("y") || !queryParams.containsKey("r")) {
                return "{\"error\": \"Missing parameters\"}";
            }

            double x = Double.parseDouble(queryParams.get("x"));
            double y = Double.parseDouble(queryParams.get("y"));
            double r = Double.parseDouble(queryParams.get("r"));

            if (x < -5 || x > 3 || y < -3 || y > 3 || r < 1 || r > 3) {
                return "{\"error\": \"Invalid data range\"}";
            }

            boolean isHit = checkHit(x, y, r);

            String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss"));

            String currentResult = String.format(
                    "{\"x\": %s, \"y\": %s, \"r\": %s, \"isHit\": %b, \"time\": \"%s\"}",
                    queryParams.get("x"), queryParams.get("y"), queryParams.get("r"), isHit, time
            );

            history.add(0, currentResult);

            StringBuilder responseJson = new StringBuilder();
            responseJson.append("{\"current\": ").append(currentResult).append(", \"history\": [");

            for (int i = 0; i < history.size(); i++) {
                responseJson.append(history.get(i));
                if (i < history.size() - 1) {
                    responseJson.append(", ");
                }
            }
            responseJson.append("]}");
            return responseJson.toString();

        } catch (NumberFormatException e) {
            return "{\"error\": \"Invalid number format\"}";
        }
    }

    private static Map<String, String> parseQueryString(String queryString) {
        HashMap<String, String> params = new HashMap<>();
        if (queryString != null && !queryString.isEmpty()) {
            String[] pairs = queryString.split("&");
            for (String pair : pairs) {
                String[] keyValue = pair.split("=");
                if (keyValue.length == 2) {
                    params.put(keyValue[0], keyValue[1]);
                }
            }
        }
        return params;
    }

    private static boolean checkHit(double x, double y, double r) {
        boolean inSquare = (x >= -r && x <= 0 && y >= 0 && y <= r);

        boolean inCircle = (x >= -r/2 && x <= 0 && y >= -r/2 && y <= 0 && (x*x + y*y) <= (r/2)*(r/2));

        boolean inTriangle = (x >= 0 && x <= r && y <= 0 && y >= -r/2 && (x - 2*y) <= r);

        return inSquare || inCircle || inTriangle;
    }
}
