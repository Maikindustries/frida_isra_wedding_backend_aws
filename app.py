from decouple import config  # read env vars
from MySqlConnection import ConnectionFactory
import requests
from uuid import uuid4
# from html.parser import HTMLParser
from flask import (
    Flask,
    session,
    render_template,
    redirect,
    request,
    url_for,
    g,
)
# CORS
from flask_cors import CORS, cross_origin

ADMIN = "/admin"

app = Flask(__name__)
# CORS, srive para que pueda usar un backend local
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

app.secret_key = config("WEB_KEY")  # checar
app.static_folder = "static"


# Pagina web invitado sin id
# DELETE - Webpage
@app.route("/")
def index():
    return render_template("index.html")


# Pagina web invitado con id
# @app.route("/<guest_id>", methods=["GET"])
# def index_with_id(guest_id):
#     print(guest_id)
#     # MySql Database
#     conn_factory = ConnectionFactory()
#     conn, cursor = conn_factory.get_connection()
#     cursor.execute("select * from invitados where id_invitado=%s", [guest_id])
#     data = cursor.fetchone()
#     conn.close()
#     print(data)
#     # {% if data_exists > 0 %}
#     # <h2>ocy</h2>
#     # <h2>{{data[1]}}</h2>
#     # <h2>{{data[2]}}</h2>
#     # <h2>{{data[3]}}</h2>
#     # {% else %}
#     # <!-- <h2>ono</h2> -->
#     # {% endif %}
#     if data is not None:
#         return render_template("index_id.html", data=data, data_exists=True)
#     #usuario no encontrado, checa bien el link que te mandaron
#     return render_template("index_id.html", data_exists=False)

# GET_INFO_BY_ID - BACKEND
@app.route("/guest/updateConfirmation", methods=["POST"])
def post_update_confirmation():
    response = request.json
    print(response)
    conn_factory = ConnectionFactory()
    conn, cursor = conn_factory.get_connection()
    guest_id = response.get("id")
    confirmacion = response.get("confirmacion")
    cursor.execute(
        "update invitados set asistencia=%s where id_invitado=%s",
        [confirmacion, guest_id]
    )
    conn.commit()
    conn.close()
    return {"Success": 201}

# GET_INFO_BY_ID - BACKEND
@app.route("/guest/<guest_id>", methods=["GET"])
def get_info_by_id(guest_id):
    conn_factory = ConnectionFactory()
    conn, cursor = conn_factory.get_connection()
    cursor.execute(
        "select * from invitados where id_invitado=%s", [guest_id]
    )
    invitado = cursor.fetchone()
    invitado_dict = dict()
    keys = [
        "id_invitado",
        "nombre",
        "boletos",
        "mesa",
        "confirmacion",
        "revisado",
    ]
    for i, key in enumerate(keys):
        invitado_dict[key] = invitado[i]
    print(invitado_dict)
    conn.close()
    return invitado_dict

# GET_INFO - BACKEND
@app.route("/get_info", methods=["GET","POST"])
def get_info():
    response = request.json
    print(response)
    if response.get("id_invitado", None):
        id_invitado = response.get("id_invitado", None)
        conn_factory = ConnectionFactory()
        conn, cursor = conn_factory.get_connection()
        cursor.execute(
            "select * from invitados where id_invitado=%s", [id_invitado]
        )
        invitado = cursor.fetchone()
        invitado_dict = dict()
        keys = [
            "id_invitado",
            "nombre",
            "boletos",
            "mesa",
            "confirmacion",
            "revisado",
        ]
        for i, key in enumerate(keys):
            invitado_dict[key] = invitado[i]
        print(invitado_dict)
        conn.close()
    return invitado_dict

# /ADMIN - App
@app.route(ADMIN)
def admin_index():
    if g.email:
        return redirect(url_for("admin_main"))
    return redirect(url_for("admin_login"))


# LOGIN - App
@app.route(f"{ADMIN}/login", methods=["GET", "POST"])
def admin_login():
    if g.email:
        return redirect(url_for("admin_main"))
    if request.method == "POST":
        session.pop("email", None)
        email = request.form["email"]
        password = request.form["password"]
        if [email, password] == [config("EMAIL_1"), config("PASSWORD_1")] or [
            email,
            password,
        ] == [config("EMAIL_2"), config("PASSWORD_2")]:
            session["email"] = email
            return redirect(url_for("admin_main"))
    #     return redirect(url_for("admin_login"))
    # else:
    return render_template("admin_login.html")


# INICIO - App
@app.route(f"{ADMIN}/inicio", methods=["GET", "POST"])
def admin_main():
    if g.email:
        return render_template("admin_inicio.html")
    return render_template("admin_login.html")

# EXCEL - Webpage
@app.route(f"{ADMIN}/excel", methods=["GET", "POST"])
def read_process_excel():
    # Read the File using Flask request
    conn_factory = ConnectionFactory()
    conn, cursor = conn_factory.get_connection()
    file = request.files["uploaded-file"]
    if file.filename != "":
        # save file in local directory
        file.save(file.filename)
        invitados = pd.read_excel(file)
        invitados_list = []
        for _, row in invitados.iterrows():
            invitados_list.append(
                [row["Nombre"], int(row["Boletos"]), int(row["Mesa"])]
            )
        cursor.executemany(
            """insert into invitados (id_invitado, nombre, mesa, boletos)
                values(REPLACE(UUID(),'-',''), %s, %s, %s)""",
            invitados_list,
        )
        conn.commit()
        conn.close()
    return redirect(url_for("admin_main"))

# GET_USERS - BACKEND
@app.route(f"{ADMIN}/get_users", methods=["GET", "POST"])
def get_users():
    # MySql Database
    conn_factory = ConnectionFactory()
    conn, cursor = conn_factory.get_connection()
    cursor.execute("select * from invitados")
    invitados = cursor.fetchall()
    conn.close()
    data = []
    for invitado in invitados:
        invitado_dict = dict()
        keys = [
            "id_invitado",
            "nombre",
            "boletos",
            "mesa",
            "confirmacion",
            "revisado",
        ]
        for i, key in enumerate(keys):
            invitado_dict[key] = invitado[i]
        data.append(invitado_dict)
    return data


# DELETE - BACKEND
@app.route(f"{ADMIN}/delete", methods=["GET", "POST"])
def delete_user():
    conn_factory = ConnectionFactory()
    conn, cursor = conn_factory.get_connection()
    response = request.json
    print(response.get("id_invitado", None))
    if response.get("id_invitado", None):
        cursor.execute(
            "delete from invitados where id_invitado = %s",
            [response["id_invitado"]],
        )
        conn.commit()
        conn.close()
        return {"status": "ok"}
    return {"status": "fail"}

# UPDATE - BACKEND
@app.route(f"{ADMIN}/update", methods=["GET", "POST"])
def update_users():
    conn_factory = ConnectionFactory()
    conn, cursor = conn_factory.get_connection()
    response = request.json
    print(response.get("updateSql", None))
    if response.get("updateSql", None):
        cursor.execute(response["updateSql"])
        conn.commit()
        conn.close()
        return {"status": "ok"}
    return {"status": "fail"}

# GET_NUMBERS - BACKEND
@app.route(f"{ADMIN}/get_numbers", methods=["GET", "POST"])
def get_numbers():
    conn_factory = ConnectionFactory()
    conn, cursor = conn_factory.get_connection()
    asistencias = ["confirmada", "no confirmada", "no vendra"]
    data = dict()
    for asistencia in asistencias:
        cursor.execute(
            """
                select sum(boletos)
                from invitados
                where asistencia = %s""",
            [asistencia],
        )
        res = cursor.fetchall()
        if res == [(None,)]:
            data[asistencia] = 0
        else:
            data[asistencia] = res[0]
    conn.close()
    print(data)
    return data

# LOGOUT - App
@app.route(f"{ADMIN}/logout")
def admin_logout():
    session.pop("email", None)
    return redirect(url_for("admin_index"))

# Keep Login - App
@app.before_request
def before_request():
    g.email = None
    if "email" in session:
        g.email = session["email"]


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
