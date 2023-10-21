import mysql.connector

class ConnectionFactory:
  def get_connection(self,
               db_host="invitados-mysql.cr3wtgo5ts9k.us-east-1.rds.amazonaws.com",
               db_username="admin",
               db_password="Webding1233",
               db_name="invitados"):
    self.conn = mysql.connector.connect(
      host=db_host, user=db_username, password=db_password, database=db_name
    )
    self.cursor = self.conn.cursor()
    return self.conn, self.cursor