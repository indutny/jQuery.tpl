(function($ , undefined) {
	var
		filters = $.template.filters = {
			"escape": function ( str ) {
				return escape(str);
			},
			"lower" : function ( str ) {
				return str.toLowerCase();
			},
			"upper" : function ( str ) {
				return str.toUpperCase();
			},
			"safe" : function ( str ) {
				return str.replace(/<|>|&|"|'/g, safe);
			}
		},
		safeArr = {
			"<" : "&lt;",
			">" : "&gt;",
			"&" : "&amp;",
			"\"" : "&quot;",
			"'" : "&#039;"
		};
		
	function nopfilter ( str ) {return str};
	
	function safe( str ) {
		return safeArr[str] || str;
	}
	
	function filter_func(filter , code) {		
		return (filters[filter] || nopfilter)(code([]).join(""));
	}
	
	$.extend($.template.modificators,{
		"filter": function ( filter , namespace) {
		
			!namespace.filter
				&&
					(namespace.filter = filter_func);
		
			filter = $.trim(filter) || "escape";
			return "$p($scope.filter('" + filter + "',function($_){";
		},
		"/filter" : function ( namespace) {
			return ";return $_}),$_,$r);";
		}
	});
	
})(jQuery)
/**@preserve jQuery.tpl filter plugin v.0.1;Copyright 2010, Fedor Indutny;Released under MIT license **/