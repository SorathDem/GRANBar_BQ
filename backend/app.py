from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)
CORS(app)

# ⚙️ Configuración de correo
EMAIL = "foryekkodem@gmail.com"
PASSWORD = "oxfqngibxunmjqlp"
RECEPTOR = "santiagoacostaavila2905@gmail.com"

@app.route("/send-report", methods=["POST"])
def send_report():
    try:
        data = request.get_json()
        fecha = data.get("fecha")
        total = data.get("total")
        tipo = data.get("tipo")  # "diario" o "mensual"
        detalles = data.get("detalles", [])

        if not fecha or not total:
            return jsonify({"ok": False, "msg": "Faltan datos"}), 400

        # Crear el correo
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Reporte {tipo.capitalize()} - {fecha}"
        msg["From"] = EMAIL
        msg["To"] = RECEPTOR

        # 🔹 Generar cuerpo HTML del correo
        html = f"""
        <html>
        <body style="font-family: Arial; color: #333;">
            <h2 style="color:#198754;">GRANBarBQ</h2>
            <p>Reporte <b>{tipo}</b> del día <b>{fecha}</b></p>
            <table border="1" cellspacing="0" cellpadding="6" style="border-collapse: collapse; width: 100%;">
                <thead style="background-color:#f2f2f2;">
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
        """
        total_general = 0
        for item in detalles:
            nombre = item.get("nombre", "Desconocido")
            cantidad = int(item.get("cantidad", 1))
            precio = float(item.get("precio", 0))
            subtotal = cantidad * precio
            total_general += subtotal
            html += f"""
                <tr>
                    <td>{nombre}</td>
                    <td>{cantidad}</td>
                    <td>${precio:.2f}</td>
                    <td>${subtotal:.2f}</td>
                </tr>
            """

        html += f"""
                </tbody>
            </table>
            <h3 style="margin-top:20px;">Total del {tipo}: ${total_general:.2f}</h3>
        </body>
        </html>
        """

        msg.attach(MIMEText(html, "html"))

        # Enviar correo
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL, PASSWORD)
            smtp.send_message(msg)

        return jsonify({"ok": True, "msg": "Correo enviado correctamente"})

    except Exception as e:
        print("❌ Error:", str(e))
        return jsonify({"ok": False, "msg": str(e)}), 500


if __name__ == "__main__":
    app.run(port=6000, debug=True)
