console.log("lets write Javascript");
let currentSong = new Audio();
let songs;
let currFolder;

//second to min
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
  currFolder = folder;
  let a = await fetch(`http://127.0.0.1:5500/${currFolder}/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  songs = [];
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      songs.push(element.href.split(`/${folder}/`)[1]);
    }
  }

  //show all the songs in the playlist
  let songUL = document
    .querySelector(".songList")
    .getElementsByTagName("ul")[0];
  songUL.innerHTML = "";
  for (const song of songs) {
    songUL.innerHTML =
      songUL.innerHTML +
      `<li>
                <i class="fas fa-music"></i>
                <div class="info">
                  <div> ${song.replaceAll("%20", "")}</div>
                </div>
                <div class="playnow">
                  <span>Play Now</span>
                  <i class="fa-solid fa-play"></i>
                </div> </li>`;
  }

  // Attach an event listener to each song
  Array.from(
    document.querySelector(".songList").getElementsByTagName("li")
  ).forEach((e) => {
    e.addEventListener("click", (element) => {
      playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
    });
  });

  return songs;
}

const playMusic = (track, pause = false) => {
  currentSong.src = `/${currFolder}/` + track;
  if (!pause) {
    currentSong.play();
    play.src = "/img/pause.svg";
  }
  document.querySelector(".songinfo").innerHTML = track;
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
  const root = "http://127.0.0.1:5500/songs/";
  const dirRes = await fetch(root);
  const dirHtml = await dirRes.text();

  const temp = document.createElement("div");
  temp.innerHTML = dirHtml;
  const anchors = Array.from(temp.querySelectorAll("a"));

  const cardContainer = document.querySelector(".cardContainer");
  cardContainer.innerHTML = "";

  for (const a of anchors) {
    if (!a.href.includes("/songs/")) continue;

    const parts = new URL(a.href).pathname.split("/").filter(Boolean);
    const folder = parts[1];               
    if (!folder) continue;

    try {
      const metaRes = await fetch(`${root}${folder}/info.json`);
      if (!metaRes.ok) {
        console.warn(`Missing info.json in ${folder}`);
        continue;
      }
      const meta = await metaRes.json();

      cardContainer.insertAdjacentHTML(
        "beforeend",
        `<div class="card" data-folder="${folder}">
           <div class="play">
             <svg class="play-button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
               <polygon points="5 3 19 12 5 21 5 3"></polygon>
             </svg>
           </div>
           <img src="/songs/${folder}/cover.jpg" alt="" />
           <h2>${meta.title}</h2>
           <p>${meta.description}</p>
         </div>`
      );
    } catch (err) {
      console.error(`Bad JSON in ${folder}/info.json`, err);
    }
  }

  // Load the playlist whenever card is clicked
  cardContainer.addEventListener("click", async (ev) => {
    const card = ev.target.closest(".card");
    if (!card) return;
    songs = await getSongs(`songs/${card.dataset.folder}`);
    playMusic(songs[0])
  });
}


async function main() {
  // Get the list of all the songs
  await getSongs("songs/ncs");
  playMusic(songs[0], true);

  // Display all the albums on the page
  displayAlbums();

  // Attach an event listener to play, next and previous
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "/img/pause.svg";
    } else {
      currentSong.pause();
      play.src = "/img/play.svg";
    }
  });

  // Listen for timeupdate event
  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(
      currentSong.currentTime
    )} /${secondsToMinutesSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  // Add an event listener to seekbar
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  // Add an event listener for hamburger
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  // Add an event listener for close button

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-100%";
  });

  // Add an event listener to previous
  previous.addEventListener("click", () => {
    console.log("Previous clicked");

    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
  });

  // Add an event listener to next
  next.addEventListener("click", () => {
    console.log("Next clicked");

    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  // Add an event to volume
  document
    .querySelector(".range")
    .getElementsByTagName("input")[0]
    .addEventListener("change", (e) => {
      console.log("Setting volume to", e.target.value, "/100");
      currentSong.volume = parseInt(e.target.value) / 100;
    });
}

// Add event listener to mute the track
document.querySelector(".volume>img").addEventListener("click",e=>{
  if(e.target.src.includes("volume.svg")){
    e.target.src = e.target.src.replace("volume.svg", "mute.svg")
    currentSong.volume = 0;
    document.querySelector(".range")
    .getElementsByTagName("input")[0].value = 0;
  }
  else{
    e.target.src = e.target.src.replace("mute.svg", "volume.svg")
    currentSong.volume = .10;
    document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
  }
})

main();
