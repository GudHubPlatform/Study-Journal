function parseUniqueDates(data) {
    const uniqueDates = [];

    data.forEach((item) => {
        if (item.event_date) {
            if (!uniqueDates.includes(item.event_date)) {
                uniqueDates.push(item.event_date);
            }
        }
        if (item.tag) {
            if (uniqueDates[uniqueDates.length - 1] !== item.tag) {
                uniqueDates.push(item.tag);
            }
        }
    });

    return uniqueDates;
};

export default parseUniqueDates;