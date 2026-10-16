
const API = "https://dog.ceo/api";

const dogImage = document.getElementById("dog-image");
const loading = document.getElementById("loading");
const dogName = document.getElementById("dog-name");
const dogDescription = document.getElementById("dog-description");
const favoriteBtn = document.getElementById("favorite-btn");
const randomBtn = document.getElementById("random-btn");
const breedSelect = document.getElementById("breed-select");
const searchBreedBtn = document.getElementById("search-breed");
const favoritesGrid = document.getElementById("favorites-grid");
const emptyFavorites = document.getElementById("empty-favorites");
const favoriteCount = document.getElementById("favorite-count");
const statusMessage = document.getElementById("status-message");

let currentDog = null;
let favorites = loadFavorites();
let busy = false;

// Recupera los favoritos guardados.
function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem("doggoFavorites"));
    return Array.isArray(saved) ? saved.filter(
      item => item &&
        typeof item.url === "string" &&
        item.url.startsWith("https://images.dog.ceo/")
    ) : [];
  } catch {
    return [];
  }
}

// Consulta la API y comprueba que la respuesta sea válida.
async function fetchAPI(endpoint) {
  const response = await fetch(`${API}${endpoint}`);

  if (!response.ok) {
    throw new Error("No se pudo conectar con Dog CEO.");
  }

  const data = await response.json();

  if (data.status !== "success") {
    throw new Error("No se encontraron imágenes.");
  }

  return data.message;
}

// Convierte nombres como german shepherd en German Shepherd.
function formatBreed(value) {
  return value
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Obtiene la raza a partir de la URL de la imagen.
function getBreedFromURL(url) {
  const match = url.match(/\/breeds\/([^/]+)\//);

  if (!match) return "Amiguito especial";

  return match[1]
    .replace(/^\w+-/, "")
    .replace(/-/g, " ");
}

// Muestra estados de carga y errores.
function setLoading(isLoading) {
  loading.hidden = !isLoading;
  dogImage.hidden = isLoading;
  randomBtn.disabled = isLoading;
  searchBreedBtn.disabled = isLoading;
  breedSelect.disabled = isLoading;
}

// Muestra un perro y actualiza sus datos.
function displayDog(url) {
  currentDog = {
    url,
    breed: getBreedFromURL(url)
  };

  dogImage.onload = () => {
    loading.hidden = true;
    dogImage.hidden = false;
  };

  dogImage.onerror = () => {
    loading.hidden = true;
    dogImage.hidden = false;
    dogImage.alt = "No se pudo cargar esta imagen";
    statusMessage.textContent = "No se pudo mostrar la foto. ¡Prueba otro perrito!";
  };

  dogImage.alt = `Perro de raza ${currentDog.breed}`;
  dogImage.src = url;

  dogName.textContent = formatBreed(currentDog.breed);
  dogDescription.textContent =
    "¡Un nuevo amigo acaba de llegar! ¿Le hacemos un lugar en favoritos?";

  statusMessage.textContent = "";
  updateFavoriteButton();
}

// Actualiza el corazón del perro actual.
function updateFavoriteButton() {
  const saved = currentDog &&
    favorites.some(item => item.url === currentDog.url);

  favoriteBtn.classList.toggle("is-favorite", Boolean(saved));
  favoriteBtn.innerHTML = saved ? "♥" : "♡";
  favoriteBtn.setAttribute(
    "aria-label",
    saved ? "Quitar de favoritos" : "Agregar a favoritos"
  );
  favoriteBtn.title = saved ? "Quitar de favoritos" : "Agregar a favoritos";
}

// Obtiene una imagen aleatoria.
async function getRandomDog() {
  if (busy) return;
  busy = true;
  setLoading(true);
  statusMessage.textContent = "";

  try {
    const url = await fetchAPI("/breeds/image/random");
    displayDog(url);
  } catch (error) {
    statusMessage.textContent =
      "¡Ups! No pudimos encontrar un perrito. Inténtalo de nuevo.";
    console.error(error);
  } finally {
    busy = false;
    setLoading(false);
    updateFavoriteButton();
  }
}

// Obtiene una imagen de la raza elegida.
async function getDogByBreed() {
  if (busy) return;

  const breed = breedSelect.value;
  if (!breed) {
    statusMessage.textContent = "Primero selecciona una raza.";
    return;
  }

  busy = true;
  setLoading(true);

  try {
    const url = await fetchAPI(`/breed/${breed}/images/random`);
    displayDog(url);
    dogName.textContent = formatBreed(breed.replace("/", " "));
    dogDescription.textContent =
      `¡Aquí tienes un adorable ejemplar de la raza ${formatBreed(breed.replace("/", " "))}!`;
  } catch (error) {
    statusMessage.textContent =
      "No pudimos encontrar esa raza. Prueba con otra.";
    console.error(error);
  } finally {
    busy = false;
    setLoading(false);
    updateFavoriteButton();
  }
}

// Carga todas las razas disponibles en el selector.
async function loadBreeds() {
  try {
    const breeds = await fetchAPI("/breeds/list/all");

    breedSelect.innerHTML = '<option value="">Elige una raza...</option>';

    Object.entries(breeds).forEach(([breed, subBreeds]) => {
      if (subBreeds.length === 0) {
        addBreedOption(breed, breed);
      } else {
        subBreeds.forEach(subBreed => {
          addBreedOption(
            `${breed}/${subBreed}`,
            `${breed} ${subBreed}`
          );
        });
      }
    });
  } catch (error) {
    breedSelect.innerHTML =
      '<option value="">No se pudieron cargar las razas</option>';
    console.error(error);
  }
}

function addBreedOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = formatBreed(label.replace("/", " "));
  breedSelect.appendChild(option);
}

// Guarda los favoritos de forma persistente.
function saveFavorites() {
  try {
    localStorage.setItem("doggoFavorites", JSON.stringify(favorites));
  } catch (error) {
    statusMessage.textContent =
      "El navegador no permite guardar favoritos en este momento.";
    console.error(error);
  }
}

// Añade o quita el perro actual de favoritos.
function toggleFavorite() {
  if (!currentDog) return;

  const index = favorites.findIndex(
    item => item.url === currentDog.url
  );

  if (index >= 0) {
    favorites.splice(index, 1);
    statusMessage.textContent = "Perrito eliminado de tus favoritos.";
  } else {
    favorites.unshift({
      url: currentDog.url,
      breed: currentDog.breed,
      date: new Date().toISOString()
    });
    statusMessage.textContent = "¡Guardado en tu colección! ♥";
  }

  saveFavorites();
  renderFavorites();
  updateFavoriteButton();
}

// Construye la galería con elementos seguros del DOM.
function renderFavorites() {
  favoritesGrid.replaceChildren();

  favoriteCount.textContent =
    `${favorites.length} ${favorites.length === 1 ? "perrito" : "perritos"}`;

  emptyFavorites.hidden = favorites.length > 0;

  favorites.forEach((dog, index) => {
    const card = document.createElement("article");
    card.className = "favorite-card";

    const image = document.createElement("img");
    image.src = dog.url;
    image.alt = `Perrito ${formatBreed(dog.breed)}`;
    image.loading = "lazy";

    const removeButton = document.createElement("button");
    removeButton.className = "remove-fav";
    removeButton.type = "button";
    removeButton.textContent = "♥";
    removeButton.setAttribute(
      "aria-label",
      `Eliminar ${formatBreed(dog.breed)} de favoritos`
    );
    removeButton.addEventListener("click", () => {
      favorites.splice(index, 1);
      saveFavorites();
      renderFavorites();
      updateFavoriteButton();
    });

    const info = document.createElement("div");
    info.className = "favorite-card-info";

    const title = document.createElement("h3");
    title.textContent = formatBreed(dog.breed);

    const date = document.createElement("p");
    date.textContent = "♥ Un flechazo perruno";

    info.append(title, date);
    card.append(image, removeButton, info);
    favoritesGrid.appendChild(card);
  });
}

// Eventos de los controles.
randomBtn.addEventListener("click", getRandomDog);
searchBreedBtn.addEventListener("click", getDogByBreed);
favoriteBtn.addEventListener("click", toggleFavorite);

// Inicializa la aplicación.
renderFavorites();
loadBreeds();
getRandomDog();
