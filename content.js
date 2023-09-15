const professorCache = {};
const fetchedProfessors = {};

// Cache with professor info, to avoid repeat api calls on mutations
const addToCache = (name, prof) => {
    if(prof === 'N/A'){
        professorCache[name] = 'N/A'
        return
    }

    const { avgRating, avgDifficulty, wouldTakeAgainPercent, numRatings, legacyId } = prof;

    professorCache[name] = {
        id: legacyId,
        rating: Number(avgRating).toFixed(1),
        difficulty: Number(avgDifficulty).toFixed(1),
        percentage: (wouldTakeAgainPercent === -1) ? 'N/A' : Math.ceil(wouldTakeAgainPercent),
        numRatings: numRatings,
    };
}

// Fetch prof info from API
const getProf = async (name) => {
    try {
        const response = await fetch(`https://glorious-gown-crow.cyclic.app/api/getProf/${name}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const { prof } = await response.json();
        addToCache(name, prof); 
        return prof;
        
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

const createProfContainerDiv = (type, name, rating, difficulty, percentage, id, numRatings) => {
    // If name is long, shorten 
    if (name.length > 18) {
        name = name.slice(0, 18) + '...';
    }

    if(type === 'N/A'){
        const urlName = name.replace(' ', '+');
        const googleSearch = `https://www.google.ca/search?q=${urlName}+rate+my+professor`

        return `
        <div style="position: relative;">
            <span class="tooltip-container">
                <div class="tooltip-name" style="text-align: center">
                    ${name}
                </div>
                <br><br><br>
                <div class="none">
                    <div>No RateMyProf profile found</div>
                    <a href="${googleSearch}" target="_blank">Search</a>
                </div>
            </span>   

            <div class="modified-name">
                <span class="rating" style="background-color: black">
                    N/A
                </span>  
                <span class="prof-name">
                    ${name}
                </span>
            </div>
        </div>
        `;
    } 

    const starPercentage = (rating / 5) * 100   

    // Change rating background color based on score 
    let backgroundColor;
    if (rating >= 0 && rating <= 2.5) backgroundColor = 'darkred';
    else if (rating > 2.5 && rating <= 3.6) backgroundColor = 'darkorange';
    else backgroundColor = 'darkgreen';

    return `
        <div style="position: relative;">
            <span class="tooltip-container">
                <div class="tooltip">
                    <div class="tooltip-name">${name}</div>
                    <div class="tooltip-rating" title="${rating}">
                        <div class="ratings">
                            <div class="empty-stars"></div>
                            <div class="full-stars" style="width:${starPercentage}%"></div>
                        </div>
                    </div>
                    <div class="tooltip-data">
                        <div class="tooltip-difficulty">
                            ${difficulty}
                            <div class="description">Difficulty level</div>
                        </div>
                        <div class="tooltip-take-again">
                            ${percentage}%  
                            <div class="description">Would take again</div>
                        </div>   
                    </div>
                    <small class="tooltip-disclaimer">
                        <hr>
                        <div class="tooltip-based">
                            Based on <a class="num-ratings" href="https://www.ratemyprofessors.com/professor/${id}" target="_blank">${numRatings} rating(s)</a>
                        </div>
                        Read reviews to determine rating accuracy
                    </small>
                </div>
            </span>   
            
            <div class="modified-name">
                <span class="rating" style="background-color: ${backgroundColor}">
                    ${rating}
                </span>  
                <span class="prof-name">
                    ${name}
                </span>
            </div>
        </div>  
    `;
}

// Modify DOM elements to display ratings + tooltips
const modifyProfElements = async (professorElement) => {
    const professorNames = professorElement.textContent.trim().split('; ');
    professorElement.innerHTML = ''

    // Clear the existing content of professorElement
    if (professorNames.length === 1 && professorNames[0] === 'Staff') {
        professorElement.textContent = 'Staff';
    }

    for (const name of professorNames) {
        if (name === 'Staff') continue;

        const ratingContainer = document.createElement('div');
        
        if (fetchedProfessors[name]) {
            await fetchedProfessors[name];
        } else {
            fetchedProfessors[name] = getProf(name);
            await fetchedProfessors[name];
        }

        if(professorCache[name] === 'N/A'){
            ratingContainer.innerHTML = createProfContainerDiv('N/A', name)

        } else {
            const { id, rating, difficulty, percentage, numRatings} = professorCache[name]
            ratingContainer.innerHTML = createProfContainerDiv('', name, rating, difficulty, percentage, id, numRatings)
        }

        const tooltip = ratingContainer.querySelector(".tooltip-container");

        const showTooltip = () => {
            const tooltips = document.querySelectorAll(".tooltip-container");
            tooltips.forEach((tooltip) => {
                tooltip.style.display = "none";
            });

            tooltip.style.display = "block";
        }

        const hideTooltip = () => {
            tooltip.style.display = "none"
        }
        
        ratingContainer.addEventListener("mouseover", (event) => {
            event.stopPropagation(); 
            showTooltip();
        });
        
        document.addEventListener("click", hideTooltip); 

        professorElement.appendChild(ratingContainer);
    }
}

// General function to be called on all professors found on the page
const displayRatings = (professorElements) => {
    professorElements.forEach((professorElement) => {
        if (!professorElement.classList.contains('ratings-modified')) {
            modifyProfElements(professorElement);
            professorElement.classList.add('ratings-modified');
        }
    });
}
    
// To observe changes in the DOM
const handleMutation = (mutationsList) => {
    mutationsList.forEach((mutation) => {
        if (mutation.type === 'childList') {
            // Update  professorElements reference
            professorElements = document.querySelectorAll('[title="Instructor(s)"]');
            displayRatings(professorElements);
        }
    });
}
    
// Funny popup
const createFunnyPopup = () => {
    const funnyPopup = document.createElement('div');
    funnyPopup.className = 'funny-popup';
  
    // Use chrome.runtime.getURL to get the extension's base URL
    const imageURL = chrome.runtime.getURL('./icons/icon128.png');
  
    funnyPopup.innerHTML = `
        <img src="${imageURL}" alt="">
        <div class="funny-popup-message">Choose wisely.</div>
    `;
    
    document.body.appendChild(funnyPopup);

    setTimeout(() => {
        funnyPopup.remove();
    }, 3000); 
}
  
chrome.runtime.sendMessage({ getExtensionState: true }, (response) => {
    if (response && response.extensionState) {
        const observer = new MutationObserver(handleMutation);
        const parentElement = document.body;
        const observerConfig = {
            childList: true,
            subtree: true,
        };
        observer.observe(parentElement, observerConfig);

        // Check if the URL contains the specific portion
        if (window.location.href.includes('https://mytimetable.mcmaster.ca/')) {
            createFunnyPopup();
        }
    }
});
  
  
  

