const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const Schema = mongoose.Schema;

const BookInstanceSchema = new Schema({
    book: { type: Schema.Types.ObjectId, ref: 'Book', requried: true },
    imprint: { type: String, required: true },
    status: {
        type: String,
        required: true,
        enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'],
        default: 'Maintenance',
    },
    due_back: { type: Date, default: Date.now },
});

// Virtual for bookinstance url
BookInstanceSchema.virtual('url').get(function() {
    return `/catalog/bookinstance/${this._id}`;
});

BookInstanceSchema.virtual('due_back_formatted').get(function() {
    return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

BookInstanceSchema.virtual('due_back_yyyymmdd').get(function() {
    return DateTime.fromJSDate(this.due_back).toFormat('yyyy-MM-dd');
})

module.exports = mongoose.model('BookInstance', BookInstanceSchema);