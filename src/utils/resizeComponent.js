function setMaxHeight(id) {
    var element = document.getElementById(id);
    var elementRect = element.getBoundingClientRect();
    var maxHeight = window.innerHeight - elementRect.top;
    element.style.maxHeight = maxHeight - 20 + 'px';
}

function setMaxWidth(id) {
    var element = document.getElementById(id);
    var elementRect = element.getBoundingClientRect();
    var maxWidth = window.innerWidth - elementRect.left;

    element.style.maxWidth = maxWidth - 20 + 'px';
}

function onWindowResize () {
    const elementsToSetHeigth = ['journal-table'];
    const elementsToSetWidth = ['journal-table'];
    elementsToSetHeigth.forEach(id => {
        setMaxHeight(id);
    });
    elementsToSetWidth.forEach(id => {
        setMaxWidth(id);
    });
};

const resizeElements = {
    subscribe() {
        onWindowResize();
        window.addEventListener('resize', onWindowResize);
    },
    destroy() {
        window.removeEventListener('resize', onWindowResize);
    },
};
export default resizeElements;
