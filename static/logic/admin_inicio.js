// Excel logic
const enviarButton = document.querySelector("[enviarButton]");
const excelButton = document.querySelector("[excelButton]");

let selectedExcel = document.getElementById("select-excel");
let fileNameField = document.getElementById("file-name");
selectedExcel.addEventListener("change", function (event) {
  let uploadedFileName = event.target.files[0].name;
  fileNameField.textContent = "Archivo: " + uploadedFileName;
  excelButton.style.display = "none";
  enviarButton.classList.add("btn-available");
});
// Excel logic

// Assitency numbers logic
const getNumbers = () => {
  fetch("http://192.168.1.85:5000/admin/get_numbers")
    .then((res) => res.json())
    .then((data) => {
      const confirmedNum = document.querySelector("[confirmedNum]");
      const rejectedNum = document.querySelector("[rejectedNum]");
      const notConfirmedNum = document.querySelector("[notConfirmedNum]");
      confirmedNum.innerHTML = data.confirmada;
      rejectedNum.innerHTML = data["no vendra"];
      notConfirmedNum.innerHTML = data["no confirmada"];
    });
};
getNumbers();
// Assitency numbers logic

// List logic
const invitedPeopleLiTemplate = document.querySelector(
  "[invited-people-template]"
);
const invitedPeopleLiContainer = document.querySelector(
  "[invited-people-li-container]"
);
const searchInput = document.querySelector("[data-search]");

let persons = [];

searchInput.addEventListener("input", (event) => {
  const value = event.target.value.toLowerCase();
  persons.forEach((person) => {
    const isVisible = person.name.toLowerCase().includes(value);
    person.element.classList.toggle("hide", !isVisible);
  });
});

fetch("http://192.168.1.85:5000/admin/get_users")
  .then((res) => res.json())
  .then((data) => {
    persons = data.map((person, index) => {
      console.log(index);
      const li = invitedPeopleLiTemplate.content.cloneNode(true).children[0];
      const name = li.querySelector("[data-name]");
      const table = li.querySelector("[data-table]");
      const nPersons = li.querySelector("[data-persons]");
      // console.log(person);
      person.id = person.id_invitado;
      name.textContent = person.nombre;
      table.textContent = person.mesa;
      nPersons.textContent = person.boletos;
      let confirmed_css = "";
      if (person.confirmacion === "no confirmada") {
        confirmed_css = "invitation-not-confirmed";
      } else if (person.confirmacion === "no vendra") {
        confirmed_css = "invitation-rejected";
      } else if (person.confirmacion === "confirmada") {
        confirmed_css = "invitation-confirmed";
      }
      li.classList.add(confirmed_css);

      // List item logic
      // Buttons
      const updateButton = li.querySelector("[updateButton]");
      const deleteButton = li.querySelector("[deleteButton]");
      const confirmUpdateButton = li.querySelector("[confirmUpdateButton]");
      const cancelUpdateButton = li.querySelector("[cancelUpdateButton]");

      // Inputs
      const nameInput = li.querySelector("[nameInput]");
      const tableInput = li.querySelector("[tableInput]");
      const ticketsInput = li.querySelector("[ticketsInput]");

      // Container
      const invitationData = li.querySelector("[invitationData]");

      updateButton.addEventListener("click", () => {
        updateButton.style.display = "none";
        deleteButton.style.display = "none";

        name.style.display = "none";
        nameInput.style.display = "inline";
        // mostrar input de nombre con placeholder de valor actual
        nameInput.placeholder = person.nombre;
        // mostrar input de boletos con placeholder de valor actual
        ticketsInput.style.display = "inline";
        nPersons.style.display = "none";
        ticketsInput.placeholder = person.boletos;
        // mostrar input de mesa con placeholder de valor actual
        tableInput.style.display = "inline";
        table.style.display = "none";
        tableInput.placeholder = person.mesa;
        // mostrar boton de confirmar
        confirmUpdateButton.style.display = "block";
        // mostrar boton de cancelar
        cancelUpdateButton.style.display = "block";
        // Quitar gap
        invitationData.classList.add("gap-zero");
      });
      // List item logic
      deleteButton.addEventListener("click", () => {
        Swal.fire({
          title: "¿Quieres borrar esta persona?",
          // showDenyButton: true,
          showCancelButton: true,
          // confirmButtonText: "Save",
          denyButtonText: `Delete`,
        }).then((result) => {
          /* Read more about isConfirmed, isDenied below */

          if (result.isConfirmed) {
            data = {
              id_invitado: person.id_invitado,
            };
            fetch("http://192.168.1.85:5000/admin/delete", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            })
              .then(() => {
                Swal.fire("Borrado exitosamente!", "", "success");
              })
              .catch((err) => {
                li.remove();
                Swal.fire(
                  "Fallo al borrar, verifica tu conexion a Internet",
                  err,
                  "info"
                );
              });
          } else if (result.isDenied) {
            Swal.fire(
              "Fallo al borrar, verifica tu conexion a Internet",
              err,
              "info"
            );
          }
        });
        // activar ventana de confirmar
        // hacer delete en base de datos
      });
      cancelUpdateButton.addEventListener("click", () => {
        updateButton.style.display = "block";
        deleteButton.style.display = "block";

        name.style.display = "block";
        nameInput.style.display = "none";

        // quitar input de boletos con placeholder de valor actual
        ticketsInput.style.display = "none";
        nPersons.style.display = "inline";
        // quitar input de mesa con placeholder de valor actual
        tableInput.style.display = "none";
        table.style.display = "inline";

        // quitar boton de confirmar
        confirmUpdateButton.style.display = "none";
        // quitar boton de cancelar
        cancelUpdateButton.style.display = "none";
        // Recuperar gap
        invitationData.classList.remove("gap-zero");
      });
      confirmUpdateButton.addEventListener("click", () => {
        // llamar backend con update
        let updateParts = [];
        let updatePartActivated = [0, 0, 0];
        if (nameInput.value !== "") {
          updateParts.push(`nombre='${nameInput.value}'`);
          updatePartActivated[0] = nameInput.value;
        }
        if (tableInput.value !== "") {
          updateParts.push(`mesa=${tableInput.value}`);
          updatePartActivated[1] = tableInput.value;
        }
        if (ticketsInput.value !== "") {
          updateParts.push(`boletos=${ticketsInput.value}`);
          updatePartActivated[2] = ticketsInput.value;
        }
        const upperUpdateSqlPart = "update invitados set";
        const lowerUpdateSqlPart = `where id_invitado='${person.id_invitado}'`;
        const updateSqlPart = updateParts.join(", ");
        if (updateParts.length > 0) {
          const updateSql = `${upperUpdateSqlPart} ${updateSqlPart} ${lowerUpdateSqlPart}`;

          data = {
            updateSql: updateSql,
          };
          fetch("http://192.168.1.85:5000/admin/update", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          })
            .then((res) => res.json())
            .then((data) => {
              if (updatePartActivated[0]) {
                name.textContent = updatePartActivated[0];
              }
              if (updatePartActivated[1]) {
                table.textContent = updatePartActivated[1];
              }
              if (updatePartActivated[2]) {
                nPersons.textContent = updatePartActivated[2];
              }
              if (updatePartActivated[1] || updatePartActivated[2]) {
                getNumbers();
              }
            });

          updateButton.style.display = "block";
          deleteButton.style.display = "block";

          name.style.display = "block";
          nameInput.style.display = "none";

          // quitar input de boletos con placeholder de valor actual
          ticketsInput.style.display = "none";
          nPersons.style.display = "inline";
          // quitar input de mesa con placeholder de valor actual
          tableInput.style.display = "none";
          table.style.display = "inline";

          // quitar boton de confirmar
          confirmUpdateButton.style.display = "none";
          // quitar boton de cancelar
          cancelUpdateButton.style.display = "none";
          // Recuperar gap
          invitationData.classList.remove("gap-zero");
        }
      });
      nameInput.addEventListener("input", (event) => {
        // li.querySelector("[nameInput]").value = event.target.value;
        nameInput.value = event.target.value;
        console.log("nameInputCurrentValue", nameInput.value);
      });
      tableInput.addEventListener("input", (event) => {
        // li.querySelector("[tableInput]").value = event.target.value;
        tableInput.value = event.target.value;
        console.log("tableInputCurrentValue", tableInput.value);
      });
      ticketsInput.addEventListener("input", (event) => {
        // li.querySelector("[ticketsInput]").value = event.target.value;
        ticketsInput.value = event.target.value;
        console.log("ticketsInputCurrentValue", ticketsInput.value);
      });

      invitedPeopleLiContainer.append(li);
      return {
        name: person.nombre,
        table: person.mesas,
        nPersons: person.boletos,
        confirmed: confirmed_css,
        element: li,
      };
    });
  });
// List logic
