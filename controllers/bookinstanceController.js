const BookInstance = require("../models/bookinstance");
const Book = require('../models/book');
const { body, validationResult } = require('express-validator');
const async = require('async');

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate("book")
    .exec(function (err, list_bookinstances) {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list_bookinstances,
      });
    });
};


// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results.
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("bookinstance_detail", {
        title: `Copy: ${bookinstance.book.title}`,
        bookinstance,
      });
    });
};


// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, "title").exec((err, books) => {
    if (err) {
      return next(err);
    }
    // Successful, so render.
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      book_list: books,
      book_status: ['Maintenance', 'Available', 'Loaned', 'Reserved']
    });
  });
};


// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render.
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance,
          book_status: ['Maintenance', 'Available', 'Loaned', 'Reserved'],
          selected_status: bookinstance.status
        });
      });
      return;
    }

    // Data from form is valid.
    bookinstance.save((err) => {
      if (err) {
        return next(err);
      }
      // Successful: redirect to new record.
      res.redirect(bookinstance.url);
    });
  },
];


// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  async.parallel(
    {
      book_instance(callback) {
        BookInstance.findById(req.params.id)
          .populate('book')
          .exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.book_instance == null) {
        // No results.
        res.redirect('/catalog/bookinstances')
      }
      // Successful, so render.
      res.render('bookinstance_delete', {
        title: 'Delete Book Instance',
        bookinstance: results.book_instance,
      });
    }
  );
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  BookInstance.findByIdAndRemove(req.body.bookinstanceid, (err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/catalog/bookinstances');
  });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
  // Get book instance and all books for form
  async.parallel(
    {
      book_instance(callback) {
        BookInstance.findById(req.params.id)
          .exec(callback);
      },
      book_list(callback) {
        Book.find(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.book_instance == null) {
        // no results
        const err = new Error('Book Instance not found');
        err.status = 404;
        return next(err);
      }
      // Success.
      res.render('bookinstance_form', {
        title: 'Update Book Instance',
        bookinstance: results.book_instance,
        book_list: results.book_list,
        book_status: ['Maintenance', 'Available', 'Loaned', 'Reserved'],
        selected_book: results.book_instance.book,
        selected_status: results.book_instance.status,
      });
    }
  );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
   // Validate and sanitize fields.
   body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
   body("imprint", "Imprint must be specified")
     .trim()
     .isLength({ min: 1 })
     .escape(),
   body("status").escape(),
   body("due_back", "Invalid date")
     .optional({ checkFalsy: true })
     .isISO8601()
     .toDate(),
  
  // Process request after validation and sanitization
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a book instance object with escaped/trimmed data and old id.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      async.parallel(
        {
          book_instance(callback) {
            BookInstance.findById(req.params.id)
              .exec(callback);
          },
          book_list(callback) {
            Book.find(callback);
          },
        },
        (err, results) => {
          if (err) {
            return next(err);
          }

          // Success.
          res.render('bookinstance_form', {
            title: 'Update Book Instance',
            bookinstance: results.book_instance,
            book_list: results.book_list,
            book_status: ['Maintenance', 'Available', 'Loaned', 'Reserved'],
            selected_book: results.book_instance.book,
            selected_status: results.book_instance.status,
          });
        }
      );
      return;
    }

    // Data form is valid. Update the record.
    BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, thebookinstance) => {
      if (err) {
        return next(err);
      }

      // Successful: redirect to book instance detail page.
      res.redirect(thebookinstance.url);
    });
  },
];
