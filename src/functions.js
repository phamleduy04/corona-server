module.exports = {
    laysodep: function(string){
        let pattern = /\B(?=(\d{3})+(?!\d))/g;
        return string.toString().replace(pattern, ',');
    }
}