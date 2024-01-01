function setMaxHeight(id) {
    if (window.isMobile) {
        return;
    }
    const element = document.getElementById(id);
    const elementRect = element.getBoundingClientRect();
    const maxHeight = window.innerHeight - elementRect.top;
    element.style.maxHeight = maxHeight + 'px';
}

function setMaxWidth(id) {
    const element = document.getElementById(id);
    const elementRect = element.getBoundingClientRect();
    const maxWidth = window.innerWidth - elementRect.left;

    element.style.maxWidth = maxWidth - 20 + 'px';
}

function onWindowResize () {
    const elementsToSetHeigth = ['table-scroll'];
    const elementsToSetWidth = ['table-scroll'];
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
